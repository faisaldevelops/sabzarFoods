import express from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
  getHoldStatus,
  cancelHold,
} from "../controllers/payments.razorpay.controller.js";
import { getHoldExpiryJobStats } from "../lib/stockHold.js";

const router = express.Router();

router.post("/razorpay-create-order", optionalAuth, createRazorpayOrder);
router.post("/razorpay-verify", optionalAuth, verifyRazorpayPayment);
router.get("/hold-status", optionalAuth, getHoldStatus);
router.post("/cancel-hold", optionalAuth, cancelHold);

router.get("/hold-expiry-job-health", (req, res) => {
  try {
    const stats = getHoldExpiryJobStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching job stats",
      error: error.message
    });
  }
});

router.post("/razorpay-webhook", razorpayWebhook);

export default router;
