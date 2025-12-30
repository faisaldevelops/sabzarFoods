import Order from "../models/order.model.js";
import Expense from "../models/expense.model.js";
import PartnerBalance from "../models/partnerBalance.model.js";
import Reimbursement from "../models/reimbursement.model.js";
import { calculateDeliveryCharge, calculatePlatformFee } from "../lib/pricing.js";

/**
 * FINANCE / COSTING MODULE
 * 
 * Business Rules:
 * 1. Partners (Dawood, Sayib, Faisal) can pay business expenses
 * 2. Each partner has a pending expense balance
 * 3. Sales are captured automatically from completed orders (Product Price only - excludes delivery/platform fees)
 * 4. Monthly recovery pool = total sales × recovery percentage (default 50%)
 * 5. Recovery pool is distributed proportionally among partners based on pending balances
 * 6. Profit = total sales - total reimbursed expenses
 * 7. Profit split: Dawood 70%, Sayib+Faisal 30%
 * 
 * Note: Delivery fees and platform fees are displayed for reference but NOT included in sales/profit calculations
 */

// Constants
const VALID_PARTNERS = ["Dawood", "Sayib", "Faisal"];
const DEFAULT_RECOVERY_PERCENTAGE = 50;
const PROFIT_SPLIT = {
  dawood: 70,
  sayibAndFaisal: 30,
};

// Helper: Escape CSV values
function escapeCSV(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const escapedStr = str.replace(/"/g, '""');
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  if (dangerousChars.some(char => escapedStr.startsWith(char))) {
    return `"'${escapedStr}"`;
  }
  const needsQuote = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
  return needsQuote ? `"${escapedStr}"` : escapedStr;
}

// Helper: Get month boundaries
function getMonthBoundaries(year, month) {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return { startDate, endDate };
}

// Helper: Calculate total sales for a month (Product Price only - excludes delivery/platform fees)
// Also calculates delivery and platform fees for display purposes
async function calculateMonthlySales(year, month) {
  const { startDate, endDate } = getMonthBoundaries(year, month);
  
  const orders = await Order.find({
    status: "paid",
    createdAt: { $gte: startDate, $lte: endDate },
  });

  let totalProductRevenue = 0;
  let totalDeliveryCharges = 0;
  let totalPlatformFeeConstant = 0;
  let totalPlatformFeeRazorpay = 0;
  let razorpayPercentage = 2.0; // Default

  orders.forEach(order => {
    // Calculate product subtotal only (this is the SALES figure)
    let orderSubtotal = 0;
    order.products.forEach(item => {
      orderSubtotal += item.quantity * item.price;
    });
    totalProductRevenue += orderSubtotal;

    // Calculate delivery and platform fees (for display only, NOT part of sales)
    const deliveryCharge = calculateDeliveryCharge(order.address);
    totalDeliveryCharges += deliveryCharge;

    const platformFee = calculatePlatformFee(orderSubtotal);
    totalPlatformFeeConstant += platformFee.constant;
    totalPlatformFeeRazorpay += platformFee.razorpayFee;
    razorpayPercentage = platformFee.razorpayPercentage; // Get from config
  });

  return {
    totalSales: totalProductRevenue, // Sales = product revenue only (used for calculations)
    totalDeliveryCharges, // For display only
    totalPlatformFeeConstant, // For display only - constant part
    totalPlatformFeeRazorpay, // For display only - Razorpay variable part
    totalPlatformFees: totalPlatformFeeConstant + totalPlatformFeeRazorpay, // For display only - total
    razorpayPercentage, // Razorpay percentage from config
    orderCount: orders.length,
  };
}

// Main dashboard - simplified finance view
export const getFinanceDashboard = async (req, res) => {
  try {
    const { year, month } = req.query;
    
    // Default to current month if not specified
    const now = new Date();
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    
    // Use parsed values only if they are valid numbers, otherwise use current date
    const targetYear = !isNaN(parsedYear) && parsedYear > 0 ? parsedYear : now.getFullYear();
    const targetMonth = !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : now.getMonth() + 1;

    // Get monthly sales
    const salesData = await calculateMonthlySales(targetYear, targetMonth);

    // Get partner balances
    const partnerBalances = await PartnerBalance.find().sort({ partner: 1 });
    
    // Ensure all partners have records
    const balanceMap = {};
    VALID_PARTNERS.forEach(partner => {
      const existing = partnerBalances.find(b => b.partner === partner);
      balanceMap[partner] = existing || {
        partner,
        pendingBalance: 0,
        totalExpenses: 0,
        totalReimbursed: 0,
      };
    });

    // Get recent expenses
    const { startDate, endDate } = getMonthBoundaries(targetYear, targetMonth);
    const recentExpenses = await Expense.find({
      expenseDate: { $gte: startDate, $lte: endDate },
    }).sort({ expenseDate: -1 }).limit(20);

    // Get existing reimbursement for this month (if any)
    const existingReimbursement = await Reimbursement.findOne({
      year: targetYear,
      month: targetMonth,
    });

    // Calculate potential recovery (preview)
    const recoveryPercentage = DEFAULT_RECOVERY_PERCENTAGE;
    const potentialRecoveryPool = salesData.totalSales * (recoveryPercentage / 100);
    
    // Calculate proportional distribution preview
    const totalPendingBalance = Object.values(balanceMap).reduce(
      (sum, b) => sum + b.pendingBalance, 0
    );
    
    const recoveryPreview = VALID_PARTNERS.map(partner => {
      const balance = balanceMap[partner];
      const proportion = totalPendingBalance > 0 
        ? balance.pendingBalance / totalPendingBalance 
        : 0;
      const potentialReimbursement = potentialRecoveryPool * proportion;
      
      return {
        partner,
        pendingBalance: balance.pendingBalance,
        totalExpenses: balance.totalExpenses,
        totalReimbursed: balance.totalReimbursed,
        proportion: proportion * 100,
        potentialReimbursement,
        balanceAfterReimbursement: Math.max(0, balance.pendingBalance - potentialReimbursement),
      };
    });

    // Calculate profit preview
    const totalReimbursement = recoveryPreview.reduce((sum, r) => sum + r.potentialReimbursement, 0);
    const profit = salesData.totalSales - totalReimbursement;
    const profitSplit = {
      dawood: profit * (PROFIT_SPLIT.dawood / 100),
      sayibAndFaisal: profit * (PROFIT_SPLIT.sayibAndFaisal / 100),
    };

    res.json({
      period: {
        year: targetYear,
        month: targetMonth,
        monthName: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' }),
      },
      sales: {
        totalSales: salesData.totalSales, // Product revenue only (used for calculations)
        totalDeliveryCharges: salesData.totalDeliveryCharges, // For display only
        platformFees: {
          constant: salesData.totalPlatformFeeConstant, // Constant part
          razorpay: salesData.totalPlatformFeeRazorpay, // Razorpay variable part
          razorpayPercentage: salesData.razorpayPercentage, // Razorpay percentage from config
          total: salesData.totalPlatformFees, // Total platform fees
        },
        orderCount: salesData.orderCount,
      },
      recovery: {
        recoveryPercentage,
        recoveryPool: potentialRecoveryPool,
        totalPendingBalance,
        partnerRecovery: recoveryPreview,
      },
      profit: {
        totalSales: salesData.totalSales,
        totalReimbursement,
        profit,
        profitSplit,
        profitSplitPercentage: PROFIT_SPLIT,
      },
      recentExpenses: recentExpenses.map(exp => ({
        id: exp._id,
        partner: exp.partner,
        amount: exp.amount,
        description: exp.description,
        date: exp.expenseDate,
      })),
      existingReimbursement: existingReimbursement ? {
        isFinalized: existingReimbursement.isFinalized,
        totalReimbursed: existingReimbursement.totalReimbursed,
        profit: existingReimbursement.profit,
        createdAt: existingReimbursement.createdAt,
      } : null,
    });
  } catch (error) {
    console.error("Error fetching finance dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Process monthly reimbursement
export const processMonthlyReimbursement = async (req, res) => {
  try {
    const { year, month, recoveryPercentage } = req.body;

    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    const targetYear = parseInt(year);
    const targetMonth = parseInt(month);
    const recoveryPct = recoveryPercentage !== undefined 
      ? parseFloat(recoveryPercentage) 
      : DEFAULT_RECOVERY_PERCENTAGE;

    if (recoveryPct < 0 || recoveryPct > 100) {
      return res.status(400).json({ message: "Recovery percentage must be between 0 and 100" });
    }

    // Check if already processed
    const existing = await Reimbursement.findOne({
      year: targetYear,
      month: targetMonth,
      isFinalized: true,
    });

    if (existing) {
      return res.status(400).json({ 
        message: "Reimbursement already finalized for this month",
        reimbursement: existing,
      });
    }

    // Calculate sales for the month
    const salesData = await calculateMonthlySales(targetYear, targetMonth);
    const recoveryPool = salesData.totalSales * (recoveryPct / 100);

    // Get current partner balances
    const partnerBalances = await PartnerBalance.find();
    const balanceMap = {};
    VALID_PARTNERS.forEach(partner => {
      const existing = partnerBalances.find(b => b.partner === partner);
      balanceMap[partner] = existing ? existing.pendingBalance : 0;
    });

    const totalPendingBalance = Object.values(balanceMap).reduce((sum, b) => sum + b, 0);

    // Calculate reimbursements proportionally
    const partnerReimbursements = [];
    let totalReimbursed = 0;

    for (const partner of VALID_PARTNERS) {
      const pendingBalanceBefore = balanceMap[partner];
      const proportion = totalPendingBalance > 0 
        ? pendingBalanceBefore / totalPendingBalance 
        : 0;
      // Cap reimbursement at pending balance
      const reimbursementAmount = Math.min(
        recoveryPool * proportion,
        pendingBalanceBefore
      );
      const pendingBalanceAfter = pendingBalanceBefore - reimbursementAmount;

      partnerReimbursements.push({
        partner,
        pendingBalanceBefore,
        reimbursementAmount,
        pendingBalanceAfter,
      });

      totalReimbursed += reimbursementAmount;

      // Update partner balance in database
      if (reimbursementAmount > 0) {
        await PartnerBalance.findOneAndUpdate(
          { partner },
          {
            $inc: {
              pendingBalance: -reimbursementAmount,
              totalReimbursed: reimbursementAmount,
            },
          },
          { upsert: true }
        );
      }
    }

    // Calculate profit and split
    const profit = salesData.totalSales - totalReimbursed;
    const profitSplit = {
      dawood: profit * (PROFIT_SPLIT.dawood / 100),
      sayibAndFaisal: profit * (PROFIT_SPLIT.sayibAndFaisal / 100),
    };

    // Create or update reimbursement record
    const reimbursement = await Reimbursement.findOneAndUpdate(
      { year: targetYear, month: targetMonth },
      {
        totalSales: salesData.totalSales,
        recoveryPercentage: recoveryPct,
        recoveryPool,
        partnerReimbursements,
        totalReimbursed,
        profit,
        profitSplit,
        isFinalized: true,
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Monthly reimbursement processed successfully",
      reimbursement,
    });
  } catch (error) {
    console.error("Error processing reimbursement:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get reimbursement history
export const getReimbursementHistory = async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const history = await Reimbursement.find({ isFinalized: true })
      .sort({ year: -1, month: -1 })
      .limit(parseInt(limit));

    res.json({ history });
  } catch (error) {
    console.error("Error fetching reimbursement history:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export expenses to CSV
export const exportFinanceCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) query.expenseDate.$gte = new Date(startDate);
      if (endDate) query.expenseDate.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query).sort({ expenseDate: -1 });
    
    const csvRows = [["Date", "Partner", "Amount", "Description"].join(",")];

    expenses.forEach(exp => {
      csvRows.push([
        new Date(exp.expenseDate).toLocaleDateString(),
        escapeCSV(exp.partner),
        exp.amount.toFixed(2),
        escapeCSV(exp.description || ""),
      ].join(","));
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=expenses-${Date.now()}.csv`);
    res.send(csvRows.join("\n"));
  } catch (error) {
    console.error("Error exporting CSV:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get monthly profit trend
export const getMonthlyProfitTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const history = await Reimbursement.find({ isFinalized: true })
      .sort({ year: -1, month: -1 })
      .limit(parseInt(months));

    const trend = history.map(r => ({
      year: r.year,
      month: r.month,
      monthName: new Date(r.year, r.month - 1).toLocaleString('default', { month: 'short' }),
      totalSales: r.totalSales,
      totalReimbursed: r.totalReimbursed,
      profit: r.profit,
    })).reverse();

    res.json({ monthlyTrend: trend });
  } catch (error) {
    console.error("Error fetching monthly trend:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Legacy endpoint - kept for compatibility but returns empty
export const getProductCosting = async (req, res) => {
  res.json({ 
    message: "Product-level costing has been removed. Use the new finance dashboard.",
    product: null,
    expenses: [],
  });
};
