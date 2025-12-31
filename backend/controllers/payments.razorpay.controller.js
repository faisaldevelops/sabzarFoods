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
import { calculatePricingBreakdown } from "../lib/pricing.js";
import { validateIndianAddress } from "../lib/addressValidation.js";

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

    // Validate that address is from India
    const validation = validateIndianAddress(address);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: "Invalid address. Only Indian addresses are allowed.",
        errors: validation.errors 
      });
    }

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

    // Calculate subtotal in rupees
    let subtotal = 0;
    for (const p of products) {
      const price = Number(p.price);
      const qty = Number(p.quantity || 1);
      subtotal += price * qty;
    }

    // Calculate pricing breakdown (delivery + platform fee)
    const pricingBreakdown = calculatePricingBreakdown(subtotal, address);
    
    // Total amount includes subtotal + delivery + platform fee
    // Platform fee already accounts for Razorpay percentage
    const totalAmount = pricingBreakdown.total;
    const totalPaise = Math.round(totalAmount * 100); // Convert to paise

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
      totalAmount: totalAmount,
      razorpayOrderId: razorpayOrder.id,
      address,
      // Store delivery and platform fees in order
      deliveryFee: pricingBreakdown.deliveryCharge,
      platformFee: pricingBreakdown.platformFee.total,
      orderSource: "website",
      paymentMethod: "razorpay",
    });

    return res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      localOrderId: holdOrder._id,
      publicOrderId: holdOrder.publicOrderId,
      expiresAt: holdOrder.expiresAt,
      holdDurationSeconds: HOLD_DURATION_SECONDS,
      pricingBreakdown: pricingBreakdown,
    });
  } catch (err) {
    console.error("createRazorpayOrder:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Verify Razorpay payment returned by client after Checkout and finalize the order.
 * Uses atomic stock decrement to prevent over-ordering.
 * 
 * SECURITY FEATURES:
 * - Idempotency check: If payment ID was already processed, returns success without re-processing
 * - Order consistency: Validates localOrderId matches razorpayOrderId to prevent tampering
 * - Atomic finalization: Uses transactions to prevent race conditions
 * 
 * Expects: { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment fields" });
    }

    // IDEMPOTENCY CHECK: Check if this payment was already processed
    // This prevents double-processing if client retries or webhook also fires
    const existingOrderWithPayment = await Order.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingOrderWithPayment) {
      console.log(`Payment ${razorpay_payment_id} already processed for order ${existingOrderWithPayment._id}`);
      return res.json({
        success: true,
        orderId: existingOrderWithPayment._id,
        publicOrderId: existingOrderWithPayment.publicOrderId,
        message: "Payment already processed"
      });
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

    // ORDER CONSISTENCY CHECK: Ensure localOrderId matches the razorpayOrderId
    // This prevents potential tampering where someone could try to pay for a different order
    if (localOrderId && order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
      console.warn(`Order ID mismatch: localOrderId ${localOrderId} has razorpayOrderId ${order.razorpayOrderId} but received ${razorpay_order_id}`);
      return res.status(400).json({
        success: false,
        message: "Order verification failed - please try again or contact support"
      });
    }

    // Check if already paid (additional check after idempotency)
    if (order.status === "paid") {
      return res.status(200).json({ 
        success: true, 
        orderId: order._id, 
        publicOrderId: order.publicOrderId,
        message: "Order already paid" 
      });
    }

    // Check if order has expired
    if (order.status === "expired") {
      return res.status(400).json({
        success: false,
        message: "Your order hold has expired. Please try again.",
        holdExpired: true
      });
    }

    // Check if order is cancelled
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This order has been cancelled.",
        holdExpired: true
      });
    }

    // Atomically finalize the order (decrement stock)
    // Pass razorpay_payment_id for atomic idempotency within the transaction
    const finalizeResult = await finalizeOrder(order._id, razorpay_payment_id);

    if (!finalizeResult.success) {
      // Check if it was already processed (race condition with another request)
      if (finalizeResult.message === "Order already paid") {
        return res.json({
          success: true,
          orderId: finalizeResult.order._id,
          publicOrderId: finalizeResult.order.publicOrderId,
          message: "Payment verified & order confirmed"
        });
      }
      
      // Finalization failed - return friendly error with options
      return res.status(400).json({
        success: false,
        message: finalizeResult.error || "Could not complete order",
        insufficientStock: !!finalizeResult.insufficientItems,
        insufficientItems: finalizeResult.insufficientItems || [],
        holdExpired: finalizeResult.error === "Order hold has expired"
      });
    }

    const finalizedOrder = finalizeResult.order;

    return res.json({ 
      success: true, 
      orderId: finalizedOrder._id, 
      publicOrderId: finalizedOrder.publicOrderId, 
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
 * 
 * SECURITY FEATURES:
 * - Idempotency: Checks if payment was already processed before finalizing
 * - Atomic operations: Uses finalizeOrder which has built-in race condition protection
 * - Handles both payment.captured and payment.authorized events
 */
export const razorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const body = req.rawBody || req.body;

    if (webhookSecret) {
      const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(body).digest("hex");
      if (expectedSignature !== signature) {
        console.warn("Razorpay webhook signature mismatch");
        return res.status(400).send("invalid signature");
      }
    }

    const event = JSON.parse(body.toString());
    const eventType = event.event;
    
    // Handle payment success events (both captured and authorized)
    if (eventType === "payment.captured" || eventType === "payment.authorized") {
      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const razorpayOrderId = payment.order_id;
      
      console.log(`Webhook: Received ${eventType} for payment ${paymentId}, order ${razorpayOrderId}`);
      
      // IDEMPOTENCY CHECK: Check if this payment was already processed
      const existingOrderWithPayment = await Order.findOne({ razorpayPaymentId: paymentId });
      if (existingOrderWithPayment) {
        console.log(`Webhook: Payment ${paymentId} already processed for order ${existingOrderWithPayment._id}`);
        return res.json({ status: "ok", message: "already processed" });
      }
      
      // Find order by razorpay order id
      const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });
      
      if (!order) {
        console.warn(`Webhook ${eventType}: no local order found for razorpay order ${razorpayOrderId}`);
        // Respond OK to prevent Razorpay from retrying - we'll handle this manually if needed
        return res.json({ status: "ok", message: "order not found" });
      }
      
      // Check if order is already in a final state
      if (order.status === "paid") {
        console.log(`Webhook: Order ${order._id} already paid`);
        return res.json({ status: "ok", message: "already paid" });
      }
      
      if (order.status === "cancelled" || order.status === "expired") {
        console.warn(`Webhook: Order ${order._id} is ${order.status}, cannot process payment`);
        // This is a problematic situation - payment was made but order expired
        // Log for manual review
        console.error(`ALERT: Payment ${paymentId} received for ${order.status} order ${order._id}. Manual review required.`);
        return res.json({ status: "ok", message: "order not eligible" });
      }
      
      // Use atomic finalize to update stock and mark as paid
      // This handles race conditions with client-side verification
      const result = await finalizeOrder(order._id, paymentId);
      
      if (result.success) {
        console.log(`Webhook: Successfully finalized order ${order._id} with payment ${paymentId}`);
      } else if (result.message === "Order already paid") {
        console.log(`Webhook: Order ${order._id} was already paid (race condition handled)`);
      } else {
        console.warn(`Webhook: finalize failed for order ${order._id}:`, result.error);
        // Don't return error - we've recorded the attempt, manual review may be needed
      }
      
    } else if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      
      console.log(`Webhook: Received payment.failed for order ${razorpayOrderId}`);
      
      // Find order by razorpay order id
      // Use atomic update to prevent race conditions
      const order = await Order.findOneAndUpdate(
        { 
          razorpayOrderId: razorpayOrderId,
          status: { $in: ["hold", "pending", "processing_payment"] } // Only update if in these states
        },
        {
          $set: {
            status: "cancelled",
            trackingStatus: "cancelled"
          },
          $push: {
            trackingHistory: {
              status: "cancelled",
              timestamp: new Date(),
              note: `Payment failed - ${payment.error_description || "order cancelled"}`
            }
          }
        },
        { new: true }
      );
      
      if (order) {
        // Release reserved stock
        await releaseReservedStock(order.products);
        console.log(`Webhook: Cancelled order ${order._id} and released stock due to payment failure`);
      } else {
        // Order might already be paid, expired, or cancelled - that's fine
        console.log(`Webhook: No eligible order found to cancel for razorpay order ${razorpayOrderId}`);
      }
      
    } else if (eventType === "order.paid") {
      // This is a backup event that fires when an order is fully paid
      const orderData = event.payload.order.entity;
      const razorpayOrderId = orderData.id;
      
      console.log(`Webhook: Received order.paid for ${razorpayOrderId}`);
      
      // Check if order exists and is not yet paid
      const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });
      if (order && order.status !== "paid") {
        console.warn(`Webhook order.paid: Order ${order._id} not marked as paid, may need manual review`);
      }
    }

    // Respond quickly to acknowledge receipt
    res.json({ status: "ok" });
  } catch (err) {
    console.error("razorpayWebhook error:", err);
    // Return 500 so Razorpay will retry the webhook
    res.status(500).send("server error");
  }
};
