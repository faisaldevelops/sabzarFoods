import Order from "../models/order.model.js";
import Expense from "../models/expense.model.js";
import ProductBOM from "../models/productBOM.model.js";
import Product from "../models/product.model.js";

/**
 * INVENTORY-BASED COSTING LOGIC
 * 
 * Key principles:
 * 1. Sales are captured automatically from paid orders
 * 2. Expenses are inventory purchases (not immediately expensed)
 * 3. Cost is recovered ONLY when units sell
 * 4. Unsold inventory cost carries forward automatically
 * 5. COGS = sold_quantity × cost_per_unit
 */

// Helper: Calculate cost per unit for a product based on BOM and expenses
async function calculateCostPerUnit(productId, endDate) {
  try {
    // Get BOM entries for the product
    const bomEntries = await ProductBOM.find({ product: productId });
    
    if (bomEntries.length === 0) {
      return { costPerUnit: 0, breakdown: [], hasIncompleteBOM: true };
    }

    // Get all expenses for this product up to endDate
    const expenseFilter = { product: productId };
    if (endDate) {
      expenseFilter.expenseDate = { $lte: new Date(endDate) };
    }
    
    const expenses = await Expense.find(expenseFilter);

    // Group expenses by component
    const componentExpenses = {};
    expenses.forEach(expense => {
      if (!componentExpenses[expense.component]) {
        componentExpenses[expense.component] = {
          totalCost: 0,
          totalQuantity: 0,
        };
      }
      componentExpenses[expense.component].totalCost += expense.totalCost;
      componentExpenses[expense.component].totalQuantity += expense.quantityPurchased;
    });

    // Calculate cost per unit based on BOM
    let totalCostPerUnit = 0;
    const breakdown = [];
    let hasIncompleteBOM = false;

    for (const bomEntry of bomEntries) {
      const component = bomEntry.component;
      const qtyPerUnit = bomEntry.quantityPerUnit;
      
      const expenseData = componentExpenses[component];
      
      if (!expenseData || expenseData.totalQuantity === 0) {
        // No expenses recorded for this component yet
        breakdown.push({
          component,
          quantityPerUnit: qtyPerUnit,
          costPerComponentUnit: 0,
          costForProduct: 0,
          warning: "No expenses recorded for this component",
        });
        hasIncompleteBOM = true;
        continue;
      }

      const costPerComponentUnit = expenseData.totalCost / expenseData.totalQuantity;
      const costForProduct = costPerComponentUnit * qtyPerUnit;
      
      totalCostPerUnit += costForProduct;
      
      breakdown.push({
        component,
        quantityPerUnit: qtyPerUnit,
        costPerComponentUnit,
        costForProduct,
      });
    }

    return {
      costPerUnit: totalCostPerUnit,
      breakdown,
      hasIncompleteBOM,
    };
  } catch (error) {
    console.error("Error calculating cost per unit:", error);
    throw error;
  }
}

// Helper: Get sales data from orders for a product in date range
async function getSalesData(productId, startDate, endDate) {
  const matchStage = {
    status: "paid", // Only count paid orders
    "products.product": productId,
  };

  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) {
      matchStage.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchStage.createdAt.$lte = new Date(endDate);
    }
  }

  const salesData = await Order.aggregate([
    { $match: matchStage },
    { $unwind: "$products" },
    { $match: { "products.product": productId } },
    {
      $group: {
        _id: "$products.product",
        totalQuantitySold: { $sum: "$products.quantity" },
        totalRevenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
        orderCount: { $sum: 1 },
      },
    },
  ]);

  if (salesData.length === 0) {
    return {
      quantitySold: 0,
      revenue: 0,
      orderCount: 0,
    };
  }

  return {
    quantitySold: salesData[0].totalQuantitySold || 0,
    revenue: salesData[0].totalRevenue || 0,
    orderCount: salesData[0].orderCount || 0,
  };
}

// Get comprehensive finance dashboard data
export const getFinanceDashboard = async (req, res) => {
  try {
    const { startDate, endDate, productId } = req.query;

    // Get all products or specific product
    const productFilter = productId ? { _id: productId } : {};
    const products = await Product.find(productFilter);

    const dashboardData = [];
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;
    let totalLockedInventoryCost = 0;

    for (const product of products) {
      // Get sales data
      const salesData = await getSalesData(product._id, startDate, endDate);
      
      // Calculate cost per unit
      const costData = await calculateCostPerUnit(product._id, endDate);
      
      // Calculate COGS (only for sold units)
      const cogs = salesData.quantitySold * costData.costPerUnit;
      
      // Get total expenses for this product
      const expenseFilter = { product: product._id };
      if (endDate) {
        expenseFilter.expenseDate = { $lte: new Date(endDate) };
      }
      const productExpenses = await Expense.find(expenseFilter);
      const totalExpenseAmount = productExpenses.reduce((sum, exp) => sum + exp.totalCost, 0);
      
      // Calculate locked inventory cost (unrecovered expenses)
      // This is the total expenses minus what's been recovered through sales
      const lockedInventoryCost = totalExpenseAmount - cogs;
      
      // Calculate profit for sold units
      const grossProfit = salesData.revenue - cogs;

      totalRevenue += salesData.revenue;
      totalCOGS += cogs;
      totalExpenses += totalExpenseAmount;
      totalLockedInventoryCost += Math.max(0, lockedInventoryCost);

      dashboardData.push({
        productId: product._id,
        productName: product.name,
        sales: {
          quantitySold: salesData.quantitySold,
          revenue: salesData.revenue,
          orderCount: salesData.orderCount,
        },
        costing: {
          costPerUnit: costData.costPerUnit,
          totalCOGS: cogs,
          costBreakdown: costData.breakdown,
          hasIncompleteBOM: costData.hasIncompleteBOM,
        },
        expenses: {
          totalExpenses: totalExpenseAmount,
          recoveredExpenses: cogs,
          lockedInventoryCost: Math.max(0, lockedInventoryCost),
        },
        profit: {
          grossProfit,
          grossProfitMargin: salesData.revenue > 0 ? (grossProfit / salesData.revenue) * 100 : 0,
        },
      });
    }

    // Calculate net profit and splits
    const netProfit = totalRevenue - totalCOGS;
    const dawoodShare = netProfit * 0.70;
    const othersShare = netProfit * 0.30;

    res.json({
      summary: {
        totalRevenue,
        totalCOGS,
        totalExpenses,
        recoveredExpenses: totalCOGS,
        lockedInventoryCost: totalLockedInventoryCost,
        netProfit,
        profitSplit: {
          dawood: {
            percentage: 70,
            amount: dawoodShare,
          },
          sayibAndFaisal: {
            percentage: 30,
            amount: othersShare,
          },
        },
      },
      products: dashboardData,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching finance dashboard:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get detailed costing for a specific product
export const getProductCosting = async (req, res) => {
  try {
    const { productId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get sales data
    const salesData = await getSalesData(productId, startDate, endDate);
    
    // Calculate cost per unit
    const costData = await calculateCostPerUnit(productId, endDate);
    
    // Get BOM
    const bom = await ProductBOM.find({ product: productId });
    
    // Get expenses
    const expenseFilter = { product: productId };
    if (startDate || endDate) {
      expenseFilter.expenseDate = {};
      if (startDate) expenseFilter.expenseDate.$gte = new Date(startDate);
      if (endDate) expenseFilter.expenseDate.$lte = new Date(endDate);
    }
    const expenses = await Expense.find(expenseFilter).sort({ expenseDate: -1 });
    
    // Calculate COGS
    const cogs = salesData.quantitySold * costData.costPerUnit;
    
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalCost, 0);
    const lockedInventoryCost = totalExpenses - cogs;
    const grossProfit = salesData.revenue - cogs;

    res.json({
      product: {
        id: product._id,
        name: product.name,
      },
      sales: salesData,
      costing: {
        costPerUnit: costData.costPerUnit,
        totalCOGS: cogs,
        breakdown: costData.breakdown,
        hasIncompleteBOM: costData.hasIncompleteBOM,
      },
      bom,
      expenses: {
        total: totalExpenses,
        recovered: cogs,
        locked: Math.max(0, lockedInventoryCost),
        details: expenses,
      },
      profit: {
        grossProfit,
        grossProfitMargin: salesData.revenue > 0 ? (grossProfit / salesData.revenue) * 100 : 0,
      },
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    console.error("Error fetching product costing:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export finance data to CSV
export const exportFinanceCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const products = await Product.find();
    const csvRows = [];
    
    // CSV Header
    csvRows.push([
      "Product Name",
      "Quantity Sold",
      "Revenue",
      "Cost Per Unit",
      "Total COGS",
      "Total Expenses",
      "Recovered Expenses",
      "Locked Inventory Cost",
      "Gross Profit",
      "Gross Profit Margin %",
    ].join(","));

    for (const product of products) {
      const salesData = await getSalesData(product._id, startDate, endDate);
      const costData = await calculateCostPerUnit(product._id, endDate);
      const cogs = salesData.quantitySold * costData.costPerUnit;
      
      const expenseFilter = { product: product._id };
      if (endDate) {
        expenseFilter.expenseDate = { $lte: new Date(endDate) };
      }
      const productExpenses = await Expense.find(expenseFilter);
      const totalExpenses = productExpenses.reduce((sum, exp) => sum + exp.totalCost, 0);
      const lockedInventoryCost = Math.max(0, totalExpenses - cogs);
      const grossProfit = salesData.revenue - cogs;
      const profitMargin = salesData.revenue > 0 ? (grossProfit / salesData.revenue) * 100 : 0;

      csvRows.push([
        `"${product.name}"`,
        salesData.quantitySold,
        salesData.revenue.toFixed(2),
        costData.costPerUnit.toFixed(2),
        cogs.toFixed(2),
        totalExpenses.toFixed(2),
        cogs.toFixed(2),
        lockedInventoryCost.toFixed(2),
        grossProfit.toFixed(2),
        profitMargin.toFixed(2),
      ].join(","));
    }

    const csvContent = csvRows.join("\n");
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=finance-report-${Date.now()}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting finance CSV:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get monthly profit trend
export const getMonthlyProfitTrend = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    
    const monthsData = [];
    const now = new Date();
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      // Get all sales for the month
      const orders = await Order.find({
        status: "paid",
        createdAt: { $gte: startDate, $lte: endDate },
      });
      
      let monthRevenue = 0;
      let monthCOGS = 0;
      
      for (const order of orders) {
        for (const item of order.products) {
          const revenue = item.quantity * item.price;
          monthRevenue += revenue;
          
          const costData = await calculateCostPerUnit(item.product, endDate);
          const itemCOGS = item.quantity * costData.costPerUnit;
          monthCOGS += itemCOGS;
        }
      }
      
      const monthProfit = monthRevenue - monthCOGS;
      
      monthsData.push({
        month: startDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
        cogs: monthCOGS,
        profit: monthProfit,
        profitSplit: {
          dawood: monthProfit * 0.70,
          sayibAndFaisal: monthProfit * 0.30,
        },
      });
    }
    
    res.json({ monthlyTrend: monthsData });
  } catch (error) {
    console.error("Error fetching monthly profit trend:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
