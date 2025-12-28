import Expense from "../models/expense.model.js";
import Product from "../models/product.model.js";

// Create a new expense
export const createExpense = async (req, res) => {
  try {
    const { product, component, quantityPurchased, totalCost, paidBy, expenseDate } = req.body;

    // Validate product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const expense = new Expense({
      product,
      component,
      quantityPurchased,
      totalCost,
      paidBy,
      expenseDate: expenseDate || new Date(),
    });

    await expense.save();

    res.status(201).json({
      message: "Expense created successfully",
      expense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all expenses with optional filters
export const getExpenses = async (req, res) => {
  try {
    const { productId, startDate, endDate, component } = req.query;
    
    const filter = {};
    
    if (productId) {
      filter.product = productId;
    }
    
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) {
        filter.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.expenseDate.$lte = new Date(endDate);
      }
    }
    
    if (component) {
      filter.component = component;
    }

    const expenses = await Expense.find(filter)
      .populate("product", "name")
      .sort({ expenseDate: -1 });

    res.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findById(id).populate("product", "name");
    
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an expense
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { product, component, quantityPurchased, totalCost, paidBy, expenseDate } = req.body;

    // Validate product exists if provided
    if (product) {
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({ message: "Product not found" });
      }
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        product,
        component,
        quantityPurchased,
        totalCost,
        paidBy,
        expenseDate,
      },
      { new: true, runValidators: true }
    ).populate("product", "name");

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({
      message: "Expense updated successfully",
      expense,
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an expense
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get expense summary by product
export const getExpenseSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage = {};
    
    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) {
        matchStage.expenseDate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.expenseDate.$lte = new Date(endDate);
      }
    }

    const summary = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$product",
          totalExpense: { $sum: "$totalCost" },
          totalQuantity: { $sum: "$quantityPurchased" },
          expenseCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          productId: "$_id",
          productName: "$product.name",
          totalExpense: 1,
          totalQuantity: 1,
          expenseCount: 1,
        },
      },
      { $sort: { totalExpense: -1 } },
    ]);

    res.json({ summary });
  } catch (error) {
    console.error("Error fetching expense summary:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
