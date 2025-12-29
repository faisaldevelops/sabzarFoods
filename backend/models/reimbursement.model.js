import mongoose from "mongoose";

/**
 * Reimbursement Model - Track monthly reimbursements to partners
 * Each month, a portion of sales is used to reimburse partner expenses
 */
const reimbursementSchema = new mongoose.Schema(
  {
    // Year and month for this reimbursement (e.g., 2024, 12 for December 2024)
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    // Total sales for this month
    totalSales: {
      type: Number,
      required: true,
      min: 0,
    },
    // Recovery percentage used (e.g., 50)
    recoveryPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // Total recovery pool (totalSales * recoveryPercentage / 100)
    recoveryPool: {
      type: Number,
      required: true,
      min: 0,
    },
    // Reimbursements per partner
    partnerReimbursements: [{
      partner: {
        type: String,
        required: true,
        enum: ["Dawood", "Sayib", "Faisal"],
      },
      pendingBalanceBefore: {
        type: Number,
        required: true,
        min: 0,
      },
      reimbursementAmount: {
        type: Number,
        required: true,
        min: 0,
      },
      pendingBalanceAfter: {
        type: Number,
        required: true,
        min: 0,
      },
    }],
    // Profit calculation
    totalReimbursed: {
      type: Number,
      required: true,
      min: 0,
    },
    profit: {
      type: Number,
      required: true,
    },
    // Profit split
    profitSplit: {
      dawood: {
        type: Number,
        required: true,
      },
      sayibAndFaisal: {
        type: Number,
        required: true,
      },
    },
    // Whether this reimbursement has been finalized
    isFinalized: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Unique index for year-month combination
reimbursementSchema.index({ year: 1, month: 1 }, { unique: true });

const Reimbursement = mongoose.model("Reimbursement", reimbursementSchema);

export default Reimbursement;
