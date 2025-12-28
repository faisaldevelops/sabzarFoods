import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    component: {
      type: String,
      required: true,
      trim: true,
    },
    quantityPurchased: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
    paidBy: {
      type: String,
      required: true,
      trim: true,
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
expenseSchema.index({ product: 1, expenseDate: -1 });
expenseSchema.index({ expenseDate: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
