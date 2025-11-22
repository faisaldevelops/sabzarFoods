// controllers/payments.razorpay.controller.js
import Razorpay from "razorpay";
import crypto from "crypto";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create a Razorpay order and a pending local order record.
 * Expects: { products, address } in req.body
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { products, address } = req.body;
    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }
    if (!address) return res.status(400).json({ message: "Address required" });

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
          password: crypto.randomBytes(16).toString('hex')
        });
      }
      
      userId = user._id;
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

    const razorpayOrder = await razorpay.orders.create(options);

    // Save a pending order locally for idempotency/reference
    const pendingOrder = new Order({
      user: userId,
      products: products.map((p) => ({
        product: p._id || p.id,
        quantity: p.quantity,
        price: p.price,
      })),
      totalAmount: totalPaise / 100,
      razorpayOrderId: razorpayOrder.id,
      status: "pending",
      address,
    });
    await pendingOrder.save();

    return res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      localOrderId: pendingOrder._id,
    });
  } catch (err) {
    console.error("createRazorpayOrder:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Verify Razorpay payment returned by client after Checkout and finalize the order.
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

    // find local pending order by localOrderId or razorpayOrderId
    let order = null;
    if (localOrderId) order = await Order.findById(localOrderId);
    if (!order) order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

    if (!order) {
      // create fallback order if pending wasn't saved (rare)
      // Get userId from req.user if authenticated, or return error
      let userId = req.user?._id;
      
      if (!userId) {
        // For guest users without pending order, we cannot proceed
        return res.status(400).json({ 
          success: false, 
          message: "Cannot verify payment: order not found. Please contact support with payment ID: " + razorpay_payment_id 
        });
      }

      order = new Order({
        user: userId,
        products: [], // ideally you passed products earlier and saved pendingOrder
        totalAmount: payment.amount / 100,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      });
    } else {
      // avoid duplicate updates
      if (order.status === "paid") {
        return res.status(200).json({ success: true, orderId: order._id, message: "Order already paid" });
      }
      order.razorpayPaymentId = razorpay_payment_id;
      order.status = "paid";
    }

    await order.save();

    return res.json({ success: true, orderId: order._id, message: "Payment verified & order saved" });
  } catch (err) {
    console.error("verifyRazorpayPayment:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
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
        order.status = "paid";
        order.razorpayPaymentId = payment.id;
        await order.save();
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
