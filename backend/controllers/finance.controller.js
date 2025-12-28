import Order from "../models/order.model.js";
import Expense from "../models/expense.model.js";
import Product from "../models/product.model.js";

/**
 * SIMPLE EXPENSE TRACKER
 * - Track who paid for product expenses
 * - When products sell, expenses are recovered to whoever paid
 */

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

// Main dashboard - expense tracking and recovery
export const getFinanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Get all products
    const products = await Product.find();

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.$gte = startDate ? new Date(startDate) : undefined;
      dateFilter.$lte = endDate ? new Date(endDate) : undefined;
      Object.keys(dateFilter).forEach(k => dateFilter[k] === undefined && delete dateFilter[k]);
    }

    // Get all expenses
    const expenseQuery = {};
    if (Object.keys(dateFilter).length > 0) {
      expenseQuery.expenseDate = dateFilter;
    }
    const allExpenses = await Expense.find(expenseQuery).populate("product", "name");

    // Get all paid orders
    const orderQuery = { status: "paid" };
    if (Object.keys(dateFilter).length > 0) {
      orderQuery.createdAt = dateFilter;
    }
    const allOrders = await Order.find(orderQuery);

    // Calculate sales revenue per product
    const salesByProduct = {};
    allOrders.forEach(order => {
      order.products.forEach(item => {
        const prodId = String(item.product);
        if (!salesByProduct[prodId]) {
          salesByProduct[prodId] = 0;
        }
        salesByProduct[prodId] += item.quantity * item.price;
      });
    });

    // Calculate expenses per product per payer
    const expensesByProduct = {};
    allExpenses.forEach(exp => {
      const prodId = String(exp.product?._id || exp.product);
      const payer = exp.paidBy.charAt(0).toUpperCase() + exp.paidBy.slice(1).toLowerCase();
      
      if (!expensesByProduct[prodId]) {
        expensesByProduct[prodId] = {
          productName: exp.product?.name || "Unknown",
          totalExpense: 0,
          byPayer: {},
        };
      }
      expensesByProduct[prodId].totalExpense += exp.totalCost;
      expensesByProduct[prodId].byPayer[payer] = (expensesByProduct[prodId].byPayer[payer] || 0) + exp.totalCost;
    });

    // Calculate recovery per product per payer
    const productSummaries = [];
    const payerTotals = {};

    Object.entries(expensesByProduct).forEach(([prodId, data]) => {
      const sales = salesByProduct[prodId] || 0;
      const recoveryRate = data.totalExpense > 0 ? Math.min(sales / data.totalExpense, 1) : 0;
      
      const payerRecovery = [];
      Object.entries(data.byPayer).forEach(([payer, paid]) => {
        const recovered = paid * recoveryRate;
        const pending = paid - recovered;
        
        payerRecovery.push({ payer, paid, recovered, pending });
        
        // Accumulate totals per payer
        if (!payerTotals[payer]) {
          payerTotals[payer] = { paid: 0, recovered: 0, pending: 0 };
        }
        payerTotals[payer].paid += paid;
        payerTotals[payer].recovered += recovered;
        payerTotals[payer].pending += pending;
      });

      productSummaries.push({
        productId: prodId,
        productName: data.productName,
        totalExpense: data.totalExpense,
        totalSales: sales,
        recoveryRate: recoveryRate * 100,
        payerRecovery,
      });
    });

    // Format payer totals
    const settlement = Object.entries(payerTotals)
      .map(([payer, totals]) => ({
        payer,
        totalPaid: totals.paid,
        totalRecovered: totals.recovered,
        pendingRecovery: totals.pending,
      }))
      .sort((a, b) => b.totalPaid - a.totalPaid);

    // Recent expenses
    const recentExpenses = allExpenses
      .sort((a, b) => new Date(b.expenseDate) - new Date(a.expenseDate))
      .slice(0, 10)
      .map(exp => ({
        id: exp._id,
        product: exp.product?.name || "Unknown",
        component: exp.component,
        amount: exp.totalCost,
        paidBy: exp.paidBy,
        date: exp.expenseDate,
      }));

    res.json({
      settlement,
      productSummaries: productSummaries.sort((a, b) => b.totalExpense - a.totalExpense),
      recentExpenses,
    });
  } catch (error) {
    console.error("Error fetching finance dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get product-specific expense details
export const getProductCosting = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const expenses = await Expense.find({ product: productId }).sort({ expenseDate: -1 });
    
    const byPayer = {};
    let total = 0;
    expenses.forEach(exp => {
      const payer = exp.paidBy.charAt(0).toUpperCase() + exp.paidBy.slice(1).toLowerCase();
      byPayer[payer] = (byPayer[payer] || 0) + exp.totalCost;
      total += exp.totalCost;
    });

    res.json({
      product: { id: product._id, name: product.name },
      totalExpense: total,
      byPayer: Object.entries(byPayer).map(([payer, amount]) => ({ payer, amount })),
      expenses: expenses.map(exp => ({
        id: exp._id,
        component: exp.component,
        quantity: exp.quantityPurchased,
        amount: exp.totalCost,
        paidBy: exp.paidBy,
        date: exp.expenseDate,
      })),
    });
  } catch (error) {
    console.error("Error fetching product expenses:", error);
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

    const expenses = await Expense.find(query).populate("product", "name").sort({ expenseDate: -1 });
    
    const csvRows = [["Date", "Product", "Component", "Quantity", "Amount", "Paid By"].join(",")];

    expenses.forEach(exp => {
      csvRows.push([
        new Date(exp.expenseDate).toLocaleDateString(),
        escapeCSV(exp.product?.name || "Unknown"),
        escapeCSV(exp.component),
        exp.quantityPurchased,
        exp.totalCost.toFixed(2),
        escapeCSV(exp.paidBy),
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

// Monthly trend (kept for compatibility)
export const getMonthlyProfitTrend = async (req, res) => {
  try {
    res.json({ monthlyTrend: [] });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
