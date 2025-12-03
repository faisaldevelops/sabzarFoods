// import express from "express";
// import { protectRoute } from "../middleware/auth.middleware.js";
// import { checkoutSuccess, createCheckoutSession } from "../controllers/payment.controller.js";

// const router = express.Router();

// router.post("/create-checkout-session", protectRoute, createCheckoutSession);
// router.post("/checkout-success", protectRoute, checkoutSuccess);

// export default router;


// routes/payment.route.js
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

// Allow both authenticated and guest users (optionalAuth instead of protectRoute)
router.post("/razorpay-create-order", optionalAuth, createRazorpayOrder);
router.post("/razorpay-verify", optionalAuth, verifyRazorpayPayment);
router.get("/hold-status", optionalAuth, getHoldStatus);
router.post("/cancel-hold", optionalAuth, cancelHold);

// Health check endpoint for monitoring the hold expiry job
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

// Webhook endpoint (Razorpay -> public)
router.post("/razorpay-webhook", razorpayWebhook);

export default router;
