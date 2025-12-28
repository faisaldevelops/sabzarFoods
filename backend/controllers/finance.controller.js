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

// Helper: Escape string values for CSV to prevent CSV injection
function escapeCSV(value) {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // If the string starts with formula-triggering characters, prefix with single quote
  // Also double any internal quotes and wrap in quotes
  const needsQuote = str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r');
  const escapedStr = str.replace(/"/g, '""');
  
  // Prefix with single quote if starts with potentially dangerous characters (formula injection prevention)
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r'];
  const startsWithDangerous = dangerousChars.some(char => escapedStr.startsWith(char));
  
  if (startsWithDangerous) {
    return `"'${escapedStr}"`;
  }
  return needsQuote || str.length === 0 ? `"${escapedStr}"` : `"${escapedStr}"`;
}

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

    // Group expenses by component (case-insensitive)
    const componentExpenses = {};
    expenses.forEach(expense => {
      const normalizedComponent = expense.component.toLowerCase();
      if (!componentExpenses[normalizedComponent]) {
        componentExpenses[normalizedComponent] = {
          totalCost: 0,
          totalQuantity: 0,
        };
      }
      componentExpenses[normalizedComponent].totalCost += expense.totalCost;
      componentExpenses[normalizedComponent].totalQuantity += expense.quantityPurchased;
    });

    // Calculate cost per unit based on BOM
    let totalCostPerUnit = 0;
    const breakdown = [];
    let hasIncompleteBOM = false;

    for (const bomEntry of bomEntries) {
      const component = bomEntry.component.toLowerCase();
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

    // Batch-load all expenses for all products to avoid N+1 queries
    const productIds = products.map((p) => p._id);
    const batchedExpenseFilter = { product: { $in: productIds } };
    if (endDate) {
      batchedExpenseFilter.expenseDate = { $lte: new Date(endDate) };
    }
    const allProductExpenses = await Expense.find(batchedExpenseFilter);

    // Pre-aggregate total expenses per product in memory
    const expenseTotalsByProductId = allProductExpenses.reduce((acc, exp) => {
      const key = String(exp.product);
      acc[key] = (acc[key] || 0) + exp.totalCost;
      return acc;
    }, {});

    // Pre-aggregate expenses by product and component for cost calculation
    const expensesByProductAndComponent = allProductExpenses.reduce((acc, exp) => {
      const productKey = String(exp.product);
      const componentKey = exp.component.toLowerCase();
      if (!acc[productKey]) {
        acc[productKey] = {};
      }
      if (!acc[productKey][componentKey]) {
        acc[productKey][componentKey] = { totalCost: 0, totalQuantity: 0 };
      }
      acc[productKey][componentKey].totalCost += exp.totalCost;
      acc[productKey][componentKey].totalQuantity += exp.quantityPurchased;
      return acc;
    }, {});

    // Batch-load all BOM entries for all products
    const allBomEntries = await ProductBOM.find({ product: { $in: productIds } });
    const bomByProductId = allBomEntries.reduce((acc, bom) => {
      const key = String(bom.product);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(bom);
      return acc;
    }, {});

    const dashboardData = [];
    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalExpenses = 0;
    let totalLockedInventoryCost = 0;

    // Compute per-product dashboard data using pre-fetched data
    for (const product of products) {
      const productIdKey = String(product._id);
      
      // Get sales data
      const salesData = await getSalesData(product._id, startDate, endDate);
      
      // Calculate cost per unit using pre-fetched data
      const bomEntries = bomByProductId[productIdKey] || [];
      const componentExpenses = expensesByProductAndComponent[productIdKey] || {};
      
      let costPerUnit = 0;
      const breakdown = [];
      let hasIncompleteBOM = bomEntries.length === 0;

      for (const bomEntry of bomEntries) {
        const component = bomEntry.component.toLowerCase();
        const qtyPerUnit = bomEntry.quantityPerUnit;
        const expenseData = componentExpenses[component];

        if (!expenseData || expenseData.totalQuantity === 0) {
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
        costPerUnit += costForProduct;
        breakdown.push({
          component,
          quantityPerUnit: qtyPerUnit,
          costPerComponentUnit,
          costForProduct,
        });
      }
      
      // Calculate COGS (only for sold units)
      const cogs = salesData.quantitySold * costPerUnit;
      
      // Get pre-aggregated total expenses for this product
      const totalExpenseAmount = expenseTotalsByProductId[productIdKey] || 0;
      
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
          costPerUnit: costPerUnit,
          totalCOGS: cogs,
          costBreakdown: breakdown,
          hasIncompleteBOM: hasIncompleteBOM,
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

    // Batch-load all expenses for all products to avoid N+1 queries
    const productIds = products.map((p) => p._id);
    const batchedExpenseFilter = { product: { $in: productIds } };
    if (endDate) {
      batchedExpenseFilter.expenseDate = { $lte: new Date(endDate) };
    }
    const allExpenses = await Expense.find(batchedExpenseFilter);

    // Pre-aggregate expenses by product
    const expenseTotalsByProductId = allExpenses.reduce((acc, exp) => {
      const key = String(exp.product);
      acc[key] = (acc[key] || 0) + exp.totalCost;
      return acc;
    }, {});

    // Pre-aggregate expenses by product and component
    const expensesByProductAndComponent = allExpenses.reduce((acc, exp) => {
      const productKey = String(exp.product);
      const componentKey = exp.component.toLowerCase();
      if (!acc[productKey]) {
        acc[productKey] = {};
      }
      if (!acc[productKey][componentKey]) {
        acc[productKey][componentKey] = { totalCost: 0, totalQuantity: 0 };
      }
      acc[productKey][componentKey].totalCost += exp.totalCost;
      acc[productKey][componentKey].totalQuantity += exp.quantityPurchased;
      return acc;
    }, {});

    // Batch-load all BOM entries
    const allBomEntries = await ProductBOM.find({ product: { $in: productIds } });
    const bomByProductId = allBomEntries.reduce((acc, bom) => {
      const key = String(bom.product);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(bom);
      return acc;
    }, {});

    for (const product of products) {
      const productIdKey = String(product._id);
      const salesData = await getSalesData(product._id, startDate, endDate);
      
      // Calculate cost per unit using pre-fetched data
      const bomEntries = bomByProductId[productIdKey] || [];
      const componentExpenses = expensesByProductAndComponent[productIdKey] || {};
      
      let costPerUnit = 0;
      for (const bomEntry of bomEntries) {
        const component = bomEntry.component.toLowerCase();
        const qtyPerUnit = bomEntry.quantityPerUnit;
        const expenseData = componentExpenses[component];

        if (expenseData && expenseData.totalQuantity > 0) {
          const costPerComponentUnit = expenseData.totalCost / expenseData.totalQuantity;
          costPerUnit += costPerComponentUnit * qtyPerUnit;
        }
      }
      
      const cogs = salesData.quantitySold * costPerUnit;
      const totalExpenses = expenseTotalsByProductId[productIdKey] || 0;
      const lockedInventoryCost = Math.max(0, totalExpenses - cogs);
      const grossProfit = salesData.revenue - cogs;
      const profitMargin = salesData.revenue > 0 ? (grossProfit / salesData.revenue) * 100 : 0;

      csvRows.push([
        escapeCSV(product.name),
        salesData.quantitySold,
        salesData.revenue.toFixed(2),
        costPerUnit.toFixed(2),
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
    
    // Calculate the date range for all months
    const oldestStartDate = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);
    const latestEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    // Batch-load all orders in the entire date range
    const allOrders = await Order.find({
      status: "paid",
      createdAt: { $gte: oldestStartDate, $lte: latestEndDate },
    });

    // Get all unique product IDs from orders
    const productIdsSet = new Set();
    allOrders.forEach(order => {
      order.products.forEach(item => {
        productIdsSet.add(String(item.product));
      });
    });
    const productIds = Array.from(productIdsSet);

    // Batch-load all expenses for these products up to the latest end date
    const allExpenses = await Expense.find({
      product: { $in: productIds },
      expenseDate: { $lte: latestEndDate },
    });

    // Batch-load all BOM entries for these products
    const allBomEntries = await ProductBOM.find({ product: { $in: productIds } });

    // Build lookup maps for BOM and expenses
    const bomByProductId = allBomEntries.reduce((acc, bom) => {
      const key = String(bom.product);
      if (!acc[key]) acc[key] = [];
      acc[key].push(bom);
      return acc;
    }, {});

    // Helper function to calculate cost per unit from pre-fetched data
    const calculateCostFromData = (productId, expenses) => {
      const productIdKey = String(productId);
      const bomEntries = bomByProductId[productIdKey] || [];
      
      if (bomEntries.length === 0) return 0;

      // Group expenses by component
      const componentExpenses = {};
      expenses.forEach(exp => {
        if (String(exp.product) !== productIdKey) return;
        const normalizedComponent = exp.component.toLowerCase();
        if (!componentExpenses[normalizedComponent]) {
          componentExpenses[normalizedComponent] = { totalCost: 0, totalQuantity: 0 };
        }
        componentExpenses[normalizedComponent].totalCost += exp.totalCost;
        componentExpenses[normalizedComponent].totalQuantity += exp.quantityPurchased;
      });

      let costPerUnit = 0;
      for (const bomEntry of bomEntries) {
        const component = bomEntry.component.toLowerCase();
        const expenseData = componentExpenses[component];
        if (expenseData && expenseData.totalQuantity > 0) {
          costPerUnit += (expenseData.totalCost / expenseData.totalQuantity) * bomEntry.quantityPerUnit;
        }
      }
      return costPerUnit;
    };
    
    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const startDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      
      // Filter orders for this month from pre-fetched data
      const monthOrders = allOrders.filter(order => 
        order.createdAt >= startDate && order.createdAt <= endDate
      );
      
      // Filter expenses up to this month's end date
      const expensesUpToEndDate = allExpenses.filter(exp => exp.expenseDate <= endDate);
      
      let monthRevenue = 0;
      let monthCOGS = 0;
      
      // Cache for cost per unit calculations within this month
      const costCache = {};
      
      for (const order of monthOrders) {
        for (const item of order.products) {
          const revenue = item.quantity * item.price;
          monthRevenue += revenue;
          
          const productIdKey = String(item.product);
          if (!(productIdKey in costCache)) {
            costCache[productIdKey] = calculateCostFromData(item.product, expensesUpToEndDate);
          }
          const itemCOGS = item.quantity * costCache[productIdKey];
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
