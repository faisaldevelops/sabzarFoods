// controllers/payments.razorpay.controller.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import {
  checkStockAvailability,
  reserveStock,
  createHoldOrder,
  finalizeOrder,
  releaseReservedStock,
  getHoldOrderInfo,
  cancelHoldOrder
} from "../lib/stockHold.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Hold duration in seconds (15 minutes)
const HOLD_DURATION_SECONDS = 15 * 60;

/**
 * Create a Razorpay order with HOLD status.
 * This reserves stock for the user and creates a 15-minute countdown.
 * Expects: { products, address } in req.body
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { products, address } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }
    if (!address) return res.status(400).json({ message: "Address required" });

    // Check stock availability (considering reserved quantities)
    const stockCheck = await checkStockAvailability(products);
    if (!stockCheck.success) {
      return res.status(400).json({
        message: "Insufficient stock for some items",
        insufficientStock: true,
        insufficientItems: stockCheck.insufficientItems
      });
    }

    // Get or create user based on phone number from address
    let userId = req.user?._id;
    
    if (!userId) {
      // Create guest user from address info
      const { phoneNumber, name, email } = address;
      if (!phoneNumber || !name) {
        return res.status(400).json({ message: "Phone number and name required in address" });
      }

      // Check if user with this phone exists
      let user = await User.findOne({ phoneNumber });
      
      if (!user) {
        // Create new guest user
        user = await User.create({
          name,
          phoneNumber,
          email: email || undefined,
          isGuest: true,
        });
      }
      
      userId = user._id;
    }

    // Reserve stock for these products
    const reserved = await reserveStock(products);
    if (!reserved) {
      return res.status(400).json({
        message: "Could not reserve stock. Items may have been purchased by another user.",
        insufficientStock: true
      });
    }

    // compute total in paise (integer)
    let totalPaise = 0;
    for (const p of products) {
      const pricePaise = Math.round(Number(p.price) * 100); // rupees -> paise
      const qty = Number(p.quantity || 1);
      totalPaise += pricePaise * qty;
    }

    const options = {
      amount: totalPaise,
      currency: "INR",
      receipt: `rcpt_${Date.now().toString(36)}_${userId.toString().slice(-6)}`,
      payment_capture: 1, // auto-capture
    };

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create(options);
    } catch (rzpError) {
      // If Razorpay order creation fails, release reserved stock
      await releaseReservedStock(products.map(p => ({
        product: p._id || p.id,
        quantity: p.quantity
      })));
      throw rzpError;
    }

    // Create a HOLD order with expiration time
    const holdOrder = await createHoldOrder({
      user: userId,
      products: products.map((p) => ({
        product: p._id || p.id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: totalPaise / 100,
      razorpayOrderId: razorpayOrder.id,
      address,
    });

    return res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      localOrderId: holdOrder._id,
      expiresAt: holdOrder.expiresAt,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
    });
  } catch (err) {
    console.error("createRazorpayOrder:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Verify Razorpay payment returned by client after Checkout and finalize the order.
 * Uses atomic stock decrement to prevent over-ordering.
 * Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    // verify signature using HMAC SHA256
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.warn("Razorpay signature mismatch");
      return res.status(400).json({ success: false, message: "Invalid signature" });
    }

    // fetch payment from Razorpay to double-check capture status
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (!payment || (payment.status !== "captured" && payment.status !== "authorized")) {
      return res.status(400).json({ success: false, message: "Payment not captured" });
    }

    // find local hold order by localOrderId or razorpayOrderId
    let order = null;
    if (localOrderId) order = await Order.findById(localOrderId);
    if (!order) order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      // For guest users without pending order, we cannot proceed
      return res.status(400).json({ 
        success: false, 
        message: "Cannot verify payment: order not found. Please contact support with payment ID: " + razorpay_payment_id 
      });
    }

    // Check if already paid
    if (order.status === "paid") {
      return res.status(200).json({ success: true, orderId: order._id, message: "Order already paid" });
    }

    // Check if order has expired
    if (order.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Your order hold has expired. Please try again.",
        holdExpired: true
      });
    }

    // Check if hold is still valid (not expired by time)
    if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
      // Mark as expired and release stock
      order.status = "expired";
      await order.save();
      await releaseReservedStock(order.products);
      
      return res.status(400).json({
        success: false,
        message: "Your order hold has expired. Please try again.",
        holdExpired: true
      });
    }

    // Atomically finalize the order (decrement stock)
    const finalizeResult = await finalizeOrder(order._id);

    if (!finalizeResult.success) {
      // Finalization failed - return friendly error with options
      return res.status(400).json({
        success: false,
        message: finalizeResult.error || "Could not complete order",
        insufficientStock: !!finalizeResult.insufficientItems,
        insufficientItems: finalizeResult.insufficientItems || [],
        holdExpired: finalizeResult.error === "Order hold has expired"
      });
    }

    // Update with Razorpay payment ID
    const finalizedOrder = finalizeResult.order;
    finalizedOrder.razorpayPaymentId = razorpay_payment_id;
    await finalizedOrder.save();

    return res.json({ 
      success: true, 
      orderId: finalizedOrder._id, 
      message: "Payment verified & order confirmed" 
    });
  } catch (err) {
    console.error("verifyRazorpayPayment:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

/**
 * Get hold order status including time remaining
 * Expects: { localOrderId } in query
 */
export const getHoldStatus = async (req, res) => {
  try {
    const { localOrderId } = req.query;
    
    if (!localOrderId) {
      return res.status(400).json({ message: "localOrderId is required" });
    }
    
    const holdInfo = await getHoldOrderInfo(localOrderId);
    
    if (!holdInfo) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    return res.json(holdInfo);
  } catch (err) {
    console.error("getHoldStatus:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Cancel a hold order and release reserved stock
 * Expects: { localOrderId } in body
 */
export const cancelHold = async (req, res) => {
  try {
    const { localOrderId } = req.body;
    
    if (!localOrderId) {
      return res.status(400).json({ message: "localOrderId is required" });
    }
    
    const result = await cancelHoldOrder(localOrderId);
    
    if (!result.success) {
      return res.status(400).json({ message: result.error });
    }
    
    return res.json({ success: true, message: "Hold cancelled successfully" });
  } catch (err) {
    console.error("cancelHold:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Webhook handler for Razorpay events (recommended as source-of-truth).
 * This route must receive raw body (see server.js change below) and verify webhook signature.
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET; // optional, set in Razorpay dashboard & .env
    const signature = req.headers["x-razorpay-signature"];
    const body = req.rawBody || req.body; // raw body set at middleware

    if (webhookSecret) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
      if (expectedSignature !== signature) {
        console.warn("Razorpay webhook signature mismatch");
        return res.status(400).send("invalid signature");
      }
    }

    const event = JSON.parse(body.toString());
    // handle event types you care about
    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      // find order by razorpay order id
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order) {
        // Use finalize to atomically update stock
        if (order.status !== "paid") {
          const result = await finalizeOrder(order._id);
          if (result.success) {
            order.razorpayPaymentId = payment.id;
            await order.save();
          } else {
            console.warn("Webhook: finalize failed for order", order._id, result.error);
          }
        }
      } else {
        // optionally create order record here (if you didn't create pending before)
        console.warn("Webhook payment.captured: no local order found for", payment.order_id);
      }
    }

    // respond quickly
    res.json({ status: "ok" });
  } catch (err) {
    console.error("razorpayWebhook:", err);
    res.status(500).send("server error");
  }
};
