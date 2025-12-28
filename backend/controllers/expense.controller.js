import Expense from "../models/expense.model.js";
import PartnerBalance from "../models/partnerBalance.model.js";

// Valid partners
const VALID_PARTNERS = ["Dawood", "Sayib", "Faisal"];

// Create a new expense (simplified: partner, amount, date, description)
export const createExpense = async (req, res) => {
  try {
    const { partner, amount, description, expenseDate } = req.body;

    // Validate partner
    if (!partner || !VALID_PARTNERS.includes(partner)) {
      return res.status(400).json({ 
        message: `Partner must be one of: ${VALID_PARTNERS.join(", ")}` 
      });
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const expense = new Expense({
      partner,
      amount,
      description: description?.trim() || "",
      expenseDate: expenseDate || new Date(),
    });

    await expense.save();

    // Update partner's pending balance
    await PartnerBalance.findOneAndUpdate(
      { partner },
      { 
        $inc: { 
          pendingBalance: amount,
          totalExpenses: amount 
        } 
      },
      { upsert: true, new: true }
    );

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
    const { partner, startDate, endDate } = req.query;
    
    const filter = {};
    
    if (partner && VALID_PARTNERS.includes(partner)) {
      filter.partner = partner;
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

    const expenses = await Expense.find(filter).sort({ expenseDate: -1 });

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
    
    const expense = await Expense.findById(id);
    
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
    const { partner, amount, description, expenseDate } = req.body;

    // Find the existing expense first
    const existingExpense = await Expense.findById(id);
    if (!existingExpense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Validate partner if provided
    if (partner && !VALID_PARTNERS.includes(partner)) {
      return res.status(400).json({ 
        message: `Partner must be one of: ${VALID_PARTNERS.join(", ")}` 
      });
    }

    // Validate amount if provided
    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    // Calculate balance adjustments
    const oldPartner = existingExpense.partner;
    const oldAmount = existingExpense.amount;
    const newPartner = partner || oldPartner;
    const newAmount = amount !== undefined ? amount : oldAmount;

    // Update the expense
    const expense = await Expense.findByIdAndUpdate(
      id,
      {
        partner: newPartner,
        amount: newAmount,
        description: description?.trim() ?? existingExpense.description,
        expenseDate: expenseDate || existingExpense.expenseDate,
      },
      { new: true, runValidators: true }
    );

    // Update partner balances if amount or partner changed
    if (oldPartner !== newPartner || oldAmount !== newAmount) {
      // Decrease old partner's balance
      await PartnerBalance.findOneAndUpdate(
        { partner: oldPartner },
        { 
          $inc: { 
            pendingBalance: -oldAmount,
            totalExpenses: -oldAmount 
          } 
        }
      );
      
      // Increase new partner's balance
      await PartnerBalance.findOneAndUpdate(
        { partner: newPartner },
        { 
          $inc: { 
            pendingBalance: newAmount,
            totalExpenses: newAmount 
          } 
        },
        { upsert: true }
      );
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

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Update partner's balance before deleting
    await PartnerBalance.findOneAndUpdate(
      { partner: expense.partner },
      { 
        $inc: { 
          pendingBalance: -expense.amount,
          totalExpenses: -expense.amount 
        } 
      }
    );

    await Expense.findByIdAndDelete(id);

    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get partner balances
export const getPartnerBalances = async (req, res) => {
  try {
    const balances = await PartnerBalance.find().sort({ partner: 1 });
    
    // Ensure all partners have a record
    const allPartners = VALID_PARTNERS.map(partner => {
      const existing = balances.find(b => b.partner === partner);
      return existing || {
        partner,
        pendingBalance: 0,
        totalExpenses: 0,
        totalReimbursed: 0,
      };
    });

    res.json({ balances: allPartners });
  } catch (error) {
    console.error("Error fetching partner balances:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get expense summary by partner
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
          _id: "$partner",
          totalExpense: { $sum: "$amount" },
          expenseCount: { $sum: 1 },
        },
      },
      {
        $project: {
          partner: "$_id",
          totalExpense: 1,
          expenseCount: 1,
          _id: 0,
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
