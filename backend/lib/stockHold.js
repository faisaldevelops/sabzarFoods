/**
 * Stock Hold Service
 * 
 * This service manages stock holds to prevent over-ordering.
 * When a user starts checkout, we create a HOLD order and optionally reserve stock.
 * If payment succeeds, we atomically decrement stock.
 * If payment fails or hold expires, we release the reserved stock.
 */

import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

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
  
  const holdOrder = new Order({
    ...orderData,
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
 * @param {string} orderId - The order ID to finalize
 * @returns {Object} - { success: boolean, order?: Order, insufficientItems?: Array }
 */
export const finalizeOrder = async (orderId) => {
  const order = await Order.findById(orderId);
  
  if (!order) {
    return { success: false, error: "Order not found" };
  }
  
  if (order.status === "paid") {
    return { success: true, order, message: "Order already paid" };
  }
  
  if (order.status === "expired" || order.status === "cancelled") {
    return { success: false, error: "Order has expired or been cancelled" };
  }
  
  // Check if hold has expired
  if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
    order.status = "expired";
    await order.save();
    // Release reserved stock
    await releaseReservedStock(order.products);
    return { success: false, error: "Order hold has expired" };
  }
  
  // Atomically decrement stock for each product
  const insufficientItems = [];
  const successfulDecrements = [];
  
  for (const item of order.products) {
    const productId = item.product;
    const qty = item.quantity;
    
    // Atomically decrement stock only if sufficient quantity available
    // Use aggregation pipeline to safely handle null reservedQuantity
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
      { new: true }
    );
    
    if (!result) {
      // Stock decrement failed - insufficient stock
      const product = await Product.findById(productId);
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
    // Rollback successful decrements
    for (const dec of successfulDecrements) {
      await Product.findByIdAndUpdate(dec.productId, {
        $inc: {
          stockQuantity: dec.qty,
          reservedQuantity: dec.qty,
          sold: -dec.qty
        }
      });
    }
    
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
  await order.save();
  
  return { success: true, order };
};

/**
 * Release expired holds - to be called periodically
 * Finds all HOLD orders that have expired and releases their reserved stock
 */
export const releaseExpiredHolds = async () => {
  const now = new Date();
  
  // Find all expired hold orders
  const expiredOrders = await Order.find({
    status: "hold",
    expiresAt: { $lte: now }
  });
  
  let releasedCount = 0;
  let errors = 0;
  
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
  
  if (releasedCount > 0) {
    console.log(`✓ Released ${releasedCount} expired hold orders`);
  }
  
  if (errors > 0) {
    console.error(`✗ Failed to release ${errors} hold orders`);
  }
  
  return releasedCount;
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
