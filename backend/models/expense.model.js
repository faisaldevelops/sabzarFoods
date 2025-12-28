import mongoose from "mongoose";

/**
 * Expense Model - Simplified for partner expense tracking
 * Partners can pay business expenses, tracked separately from products/orders
 */
const expenseSchema = new mongoose.Schema(
  {
    partner: {
      type: String,
      required: true,
      enum: ["Dawood", "Sayib", "Faisal"],
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    expenseDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
expenseSchema.index({ partner: 1, expenseDate: -1 });
expenseSchema.index({ expenseDate: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
