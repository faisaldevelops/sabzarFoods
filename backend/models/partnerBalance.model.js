import mongoose from "mongoose";

/**
 * PartnerBalance Model - Track pending expense balance per partner
 * This stores the cumulative pending balance that hasn't been reimbursed
 */
const partnerBalanceSchema = new mongoose.Schema(
  {
    partner: {
      type: String,
      required: true,
      unique: true,
      enum: ["Dawood", "Sayib", "Faisal"],
    },
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalReimbursed: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const PartnerBalance = mongoose.model("PartnerBalance", partnerBalanceSchema);

export default PartnerBalance;
