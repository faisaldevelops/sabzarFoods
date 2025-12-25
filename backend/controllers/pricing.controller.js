/**
 * Pricing Controller
 * Handles pricing breakdown calculations
 */

import { calculatePricingBreakdown } from '../lib/pricing.js';

/**
 * Calculate pricing breakdown for an order
 * Expects: { subtotal, address } in req.body
 */
export const calculatePricing = async (req, res) => {
  try {
    const { subtotal, address } = req.body;

    if (subtotal === undefined || subtotal === null) {
      return res.status(400).json({ message: "Subtotal is required" });
    }

    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    const subtotalNum = parseFloat(subtotal);
    if (isNaN(subtotalNum) || subtotalNum < 0) {
      return res.status(400).json({ message: "Invalid subtotal" });
    }

    const breakdown = calculatePricingBreakdown(subtotalNum, address);

    return res.json({
      success: true,
      ...breakdown
    });
  } catch (err) {
    console.error("calculatePricing error:", err);
    return res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: err.message 
    });
  }
};

