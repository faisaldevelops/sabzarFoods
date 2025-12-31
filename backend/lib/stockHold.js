/**
 * Stock Hold Service
 * 
 * This service manages stock holds to prevent over-ordering.
 * When a user starts checkout, we create a HOLD order and optionally reserve stock.
 * If payment succeeds, we atomically decrement stock.
 * If payment fails or hold expires, we release the reserved stock.
 * 
 * SECURITY: Uses MongoDB transactions and atomic operations to prevent race conditions.
 */

import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import crypto from "crypto";

// Helper: hash + base62 encode
function generatePublicOrderId(orderData) {
  const hash = crypto.createHash('sha256').update(JSON.stringify(orderData) + Date.now()).digest();
  const base62 = hash.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase();
  return base62;
}

// Hold duration in milliseconds (15 minutes)
const HOLD_DURATION_MS = 15 * 60 * 1000;

/**
 * Check if sufficient stock is available for the given products
 * @param {Array} products - Array of { productId, quantity }
 * @returns {Object} - { success: boolean, insufficientItems: Array }
 */
export const checkStockAvailability = async (products) => {
  const insufficientItems = [];
  
  for (const item of products) {
    const productId = item._id || item.id || item.product;
    const requestedQty = item.quantity || 1;
    
    const product = await Product.findById(productId);
    if (!product) {
      insufficientItems.push({
        productId,
        name: item.name || "Unknown",
        requested: requestedQty,
        available: 0,
        error: "Product not found"
      });
      continue;
    }
    
    // Available = stockQuantity - reservedQuantity (handle null/undefined reservedQuantity)
    const reservedQty = product.reservedQuantity || 0;
    const availableStock = product.stockQuantity - reservedQty;
    
    if (availableStock < requestedQty) {
      insufficientItems.push({
        productId: product._id,
        name: product.name,
        requested: requestedQty,
        available: Math.max(0, availableStock),
        error: "Insufficient stock"
      });
    }
  }
  
  return {
    success: insufficientItems.length === 0,
    insufficientItems
  };
};

/**
 * Reserve stock for products (increment reservedQuantity)
 * @param {Array} products - Array of { productId, quantity }
 * @returns {boolean} - true if successful
 */
export const reserveStock = async (products) => {
  const updates = [];
  
  for (const item of products) {
    const productId = item._id || item.id || item.product;
    const qty = item.quantity || 1;
    
    // First, ensure reservedQuantity field exists (for older products)
    await Product.updateOne(
      { _id: productId, reservedQuantity: { $exists: false } },
      { $set: { reservedQuantity: 0 } }
    );
    
    // Atomically increment reservedQuantity only if enough stock available
    // Use $ifNull to handle cases where reservedQuantity might still be null
    const result = await Product.findOneAndUpdate(
      {
        _id: productId,
        $expr: {
          $gte: [
            { $subtract: ["$stockQuantity", { $ifNull: ["$reservedQuantity", 0] }] },
            qty
          ]
        }
      },
      {
        $inc: { reservedQuantity: qty }
      },
      { new: true }
    );
    
    if (!result) {
      // Rollback previously reserved items
      for (const update of updates) {
        await Product.findByIdAndUpdate(
          update.productId,
          { $inc: { reservedQuantity: -update.qty } }
        );
      }
      return false;
    }
    
    updates.push({ productId, qty });
  }
  
  return true;
};

/**
 * Release reserved stock for products
 * @param {Array} products - Array of { product (id), quantity }
 */
export const releaseReservedStock = async (products) => {
  for (const item of products) {
    const productId = item.product || item._id || item.id;
    const qty = item.quantity || 1;
    
    // Use $max to prevent reservedQuantity from going below 0
    await Product.findByIdAndUpdate(
      productId,
      [
        {
          $set: {
            reservedQuantity: {
              $max: [0, { $subtract: ["$reservedQuantity", qty] }]
            }
          }
        }
      ]
    );
  }
};

/**
 * Create a HOLD order with expiration time
 * @param {Object} orderData - Order data including user, products, address, etc.
 * @returns {Object} - Created order with hold status
 */
export const createHoldOrder = async (orderData) => {
  const expiresAt = new Date(Date.now() + HOLD_DURATION_MS);
  const publicOrderId = generatePublicOrderId(orderData);
  const holdOrder = new Order({
    ...orderData,
    publicOrderId,
    status: "hold",
    expiresAt,
    trackingStatus: "pending",
    trackingHistory: [{
      status: "pending",
      timestamp: new Date(),
      note: "Order hold created - awaiting payment"
    }]
  });
  await holdOrder.save();
  return holdOrder;
};

/**
 * Atomically finalize an order by decrementing stock
 * This is the critical section that prevents over-ordering
 * 
 * SECURITY: Uses atomic findOneAndUpdate to lock the order and MongoDB transactions
 * to ensure all-or-nothing stock updates. This prevents race conditions where
 * multiple requests could finalize the same order.
 * 
 * @param {string} orderId - The order ID to finalize
 * @param {string} razorpayPaymentId - Optional payment ID for idempotency check
 * @returns {Object} - { success: boolean, order?: Order, insufficientItems?: Array }
 */
export const finalizeOrder = async (orderId, razorpayPaymentId = null) => {
  // Step 1: Atomically check and lock the order to prevent race conditions
  // This is the CRITICAL fix - we use findOneAndUpdate with status conditions
  // to ensure only one request can transition the order from hold to processing
  const order = await Order.findOneAndUpdate(
    {
      _id: orderId,
      status: { $in: ["hold", "pending"] }, // Only orders in these states can be finalized
      $or: [
        { expiresAt: { $gt: new Date() } }, // Not expired by time
        { expiresAt: null } // No expiration set
      ]
    },
    {
      $set: { status: "processing_payment" } // Intermediate state to lock the order
    },
    { new: true }
  );

  // If no order found, check why
  if (!order) {
    const existingOrder = await Order.findById(orderId);
    
    if (!existingOrder) {
      return { success: false, error: "Order not found" };
    }
    
    if (existingOrder.status === "paid") {
      return { success: true, order: existingOrder, message: "Order already paid" };
    }
    
    if (existingOrder.status === "processing_payment") {
      // Another request is currently processing this order
      return { success: false, error: "Order is being processed by another request" };
    }
    
    if (existingOrder.status === "expired" || existingOrder.status === "cancelled") {
      return { success: false, error: "Order has expired or been cancelled" };
    }
    
    // Check if hold has expired by time
    if (existingOrder.expiresAt && new Date() > new Date(existingOrder.expiresAt)) {
      existingOrder.status = "expired";
      await existingOrder.save();
      await releaseReservedStock(existingOrder.products);
      return { success: false, error: "Order hold has expired" };
    }
    
    return { success: false, error: "Order cannot be finalized in current state" };
  }

  // Step 2: Attempt to use a MongoDB transaction for atomic stock updates
  // Falls back to non-transactional operations if transactions aren't supported
  // (e.g., standalone MongoDB without replica set)
  
  let useTransaction = true;
  let session = null;
  
  try {
    session = await mongoose.startSession();
    await session.startTransaction();
  } catch (sessionError) {
    // Transactions not supported (standalone MongoDB without replica set)
    console.warn("MongoDB transactions not available, using fallback mode:", sessionError.message);
    useTransaction = false;
    session = null;
  }
  
  try {
    const insufficientItems = [];
    const successfulDecrements = [];
    
    for (const item of order.products) {
      const productId = item.product;
      const qty = item.quantity;
      
      // Atomically decrement stock only if sufficient quantity available
      const updateOptions = { new: true };
      if (useTransaction && session) {
        updateOptions.session = session;
      }
      
      const result = await Product.findOneAndUpdate(
        {
          _id: productId,
          stockQuantity: { $gte: qty }
        },
        [
          {
            $set: {
              stockQuantity: { $subtract: ["$stockQuantity", qty] },
              reservedQuantity: { $max: [0, { $subtract: [{ $ifNull: ["$reservedQuantity", 0] }, qty] }] },
              sold: { $add: [{ $ifNull: ["$sold", 0] }, qty] }
            }
          }
        ],
        updateOptions
      );
      
      if (!result) {
        // Stock decrement failed - insufficient stock
        const product = useTransaction && session 
          ? await Product.findById(productId).session(session)
          : await Product.findById(productId);
        insufficientItems.push({
          productId,
          name: product?.name || "Unknown",
          requested: qty,
          available: product?.stockQuantity || 0
        });
      } else {
        successfulDecrements.push({ productId, qty });
      }
    }
    
    if (insufficientItems.length > 0) {
      // Abort transaction if using one
      if (useTransaction && session) {
        await session.abortTransaction();
      } else {
        // Fallback: manually rollback successful decrements
        for (const dec of successfulDecrements) {
          await Product.findByIdAndUpdate(dec.productId, {
            $inc: {
              stockQuantity: dec.qty,
              reservedQuantity: dec.qty,
              sold: -dec.qty
            }
          });
        }
      }
      
      // Revert order status back to hold
      order.status = "hold";
      await order.save();
      
      return {
        success: false,
        error: "Insufficient stock for some items",
        insufficientItems
      };
    }
    
    // All stock decrements successful - mark order as paid
    order.status = "paid";
    order.trackingStatus = "processing";
    order.trackingHistory.push({
      status: "processing",
      timestamp: new Date(),
      note: "Payment confirmed - order processing"
    });
    
    // Store razorpayPaymentId if provided (for idempotency)
    if (razorpayPaymentId) {
      order.razorpayPaymentId = razorpayPaymentId;
    }
    
    if (useTransaction && session) {
      await order.save({ session });
      await session.commitTransaction();
    } else {
      await order.save();
    }
    
    return { success: true, order };
    
  } catch (error) {
    // Abort transaction on any error
    if (useTransaction && session) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError);
      }
    }
    
    // Revert order status back to hold if it was locked
    try {
      const revertedOrder = await Order.findByIdAndUpdate(
        orderId,
        { $set: { status: "hold" } },
        { new: true }
      );
      if (revertedOrder) {
        console.log(`Reverted order ${orderId} status to hold after error`);
      }
    } catch (revertError) {
      console.error(`Failed to revert order ${orderId} status:`, revertError);
    }
    
    console.error("Error in finalizeOrder:", error);
    return { success: false, error: "Failed to finalize order: " + error.message };
    
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Release expired holds - to be called periodically
 * Finds all HOLD orders that have expired and releases their reserved stock.
 * Also recovers stuck "processing_payment" orders that may have been left
 * in that state due to server crashes or transaction failures.
 */
export const releaseExpiredHolds = async () => {
  const now = new Date();
  
  // Find all expired hold orders
  const expiredOrders = await Order.find({
    status: "hold",
    expiresAt: { $lte: now }
  });
  
  // Also find stuck processing_payment orders (older than 5 minutes)
  // These are orders where the transaction started but never completed
  const stuckThreshold = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
  const stuckOrders = await Order.find({
    status: "processing_payment",
    updatedAt: { $lte: stuckThreshold }
  });
  
  let releasedCount = 0;
  let recoveredCount = 0;
  let errors = 0;
  
  // Handle expired hold orders
  for (const order of expiredOrders) {
    try {
      // Release reserved stock
      await releaseReservedStock(order.products);
      
      // Update order status
      order.status = "expired";
      order.trackingHistory.push({
        status: "cancelled",
        timestamp: new Date(),
        note: "Order hold expired - payment not completed"
      });
      await order.save();
      
      releasedCount++;
    } catch (err) {
      console.error(`Error releasing hold for order ${order._id}:`, err);
      errors++;
    }
  }
  
  // Handle stuck processing_payment orders
  for (const order of stuckOrders) {
    try {
      console.log(`Recovering stuck order ${order._id} (status: processing_payment)`);
      
      // Check if this order actually has a payment
      if (order.razorpayPaymentId) {
        // Order has payment ID - mark as paid (payment likely succeeded)
        order.status = "paid";
        order.trackingStatus = "processing";
        order.trackingHistory.push({
          status: "processing",
          timestamp: new Date(),
          note: "Order recovered from stuck state - payment confirmed"
        });
        await order.save();
        console.log(`Recovered order ${order._id} as paid (had payment ID)`);
      } else if (order.expiresAt && new Date(order.expiresAt) < now) {
        // Order expired while stuck - release stock and mark as expired
        await releaseReservedStock(order.products);
        order.status = "expired";
        order.trackingHistory.push({
          status: "cancelled",
          timestamp: new Date(),
          note: "Order recovered from stuck state - expired"
        });
        await order.save();
        console.log(`Recovered order ${order._id} as expired`);
      } else {
        // Order hasn't expired and no payment - revert to hold
        order.status = "hold";
        order.trackingHistory.push({
          status: "pending",
          timestamp: new Date(),
          note: "Order recovered from stuck state - awaiting payment"
        });
        await order.save();
        console.log(`Recovered order ${order._id} back to hold status`);
      }
      
      recoveredCount++;
    } catch (err) {
      console.error(`Error recovering stuck order ${order._id}:`, err);
      errors++;
    }
  }
  
  if (releasedCount > 0) {
    console.log(`✓ Released ${releasedCount} expired hold orders`);
  }
  
  if (recoveredCount > 0) {
    console.log(`✓ Recovered ${recoveredCount} stuck processing_payment orders`);
  }
  
  if (errors > 0) {
    console.error(`✗ Failed to process ${errors} orders`);
  }
  
  return releasedCount + recoveredCount;
};

/**
 * Get hold order info including time remaining
 * @param {string} orderId - The order ID
 * @returns {Object} - Order info with time remaining
 */
export const getHoldOrderInfo = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    return null;
  }
  
  const now = new Date();
  const expiresAt = order.expiresAt ? new Date(order.expiresAt) : null;
  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0;
  
  return {
    orderId: order._id,
    status: order.status,
    expiresAt: order.expiresAt,
    remainingSeconds: Math.floor(remainingMs / 1000),
    isExpired: remainingMs <= 0 && order.status === "hold"
  };
};

/**
 * Cancel a hold order and release reserved stock
 * @param {string} orderId - The order ID to cancel
 */
export const cancelHoldOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order || order.status !== "hold") {
    return { success: false, error: "Order not found or not in hold status" };
  }
  
  // Release reserved stock
  await releaseReservedStock(order.products);
  
  // Update order status
  order.status = "cancelled";
  order.trackingHistory.push({
    status: "cancelled",
    timestamp: new Date(),
    note: "Order cancelled by user"
  });
  await order.save();
  
  return { success: true, order };
};

// Start the hold expiry cleanup job (runs every minute)
let holdExpiryIntervalId = null;
let jobStats = {
  startTime: null,
  lastRunTime: null,
  totalRuns: 0,
  totalReleased: 0,
  errors: 0
};

export const startHoldExpiryJob = () => {
  jobStats.startTime = new Date();
  console.log("🔄 Starting hold expiry cleanup job (runs every 60 seconds)");
  
  // Run immediately on startup to catch any holds that expired while server was down
  releaseExpiredHolds()
    .then(count => {
      jobStats.lastRunTime = new Date();
      jobStats.totalRuns++;
      jobStats.totalReleased += count;
      
      if (count > 0) {
        console.log(`🧹 Initial cleanup: Released ${count} expired holds from server downtime`);
      } else {
        console.log("✓ Initial cleanup: No expired holds found");
      }
    })
    .catch(err => {
      jobStats.errors++;
      console.error("❌ Error in initial hold expiry cleanup:", err);
    });
  
  // Then run every minute
  holdExpiryIntervalId = setInterval(async () => {
    try {
      const count = await releaseExpiredHolds();
      jobStats.lastRunTime = new Date();
      jobStats.totalRuns++;
      jobStats.totalReleased += count;
    } catch (err) {
      jobStats.errors++;
      console.error("❌ Error in hold expiry cleanup job:", err);
    }
  }, 60 * 1000);
};

// Stop the hold expiry cleanup job (for graceful shutdown)
export const stopHoldExpiryJob = () => {
  if (holdExpiryIntervalId) {
    clearInterval(holdExpiryIntervalId);
    holdExpiryIntervalId = null;
    console.log("Hold expiry cleanup job stopped");
  }
};

// Get job statistics for monitoring
export const getHoldExpiryJobStats = () => {
  return {
    ...jobStats,
    isRunning: holdExpiryIntervalId !== null,
    uptimeSeconds: jobStats.startTime ? Math.floor((Date.now() - jobStats.startTime) / 1000) : 0,
    secondsSinceLastRun: jobStats.lastRunTime ? Math.floor((Date.now() - jobStats.lastRunTime) / 1000) : null
  };
};
