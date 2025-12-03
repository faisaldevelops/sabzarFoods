/**
 * One-time cleanup script to fix stuck reserved quantities
 * Run this script if you notice products have reservedQuantity > 0 for extended periods
 * 
 * Usage: node backend/scripts/cleanupStuckReservations.js
 */

import dotenv from "dotenv";
import { connectDB } from "../lib/db.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

dotenv.config({ path: "./.env" });

const cleanupStuckReservations = async () => {
  try {
    console.log("Starting cleanup of stuck reservations...");
    
    await connectDB();
    
    // 1. Find all expired or cancelled hold orders that might not have been cleaned up
    const now = new Date();
    const staleOrders = await Order.find({
      status: { $in: ["hold", "expired", "cancelled"] },
      $or: [
        { expiresAt: { $lte: now } }, // Expired holds
        { status: "expired" }, // Already marked expired
        { status: "cancelled" } // Cancelled orders
      ]
    });
    
    console.log(`Found ${staleOrders.length} stale hold/expired/cancelled orders`);
    
    // 2. For each stale order, ensure reserved stock is released
    for (const order of staleOrders) {
      console.log(`Processing order ${order._id} (status: ${order.status})`);
      
      for (const item of order.products) {
        const productId = item.product;
        const qty = item.quantity;
        
        // Decrement reservedQuantity (but never below 0)
        const result = await Product.findByIdAndUpdate(
          productId,
          [
            {
              $set: {
                reservedQuantity: {
                  $max: [0, { $subtract: [{ $ifNull: ["$reservedQuantity", 0] }, qty] }]
                }
              }
            }
          ],
          { new: true }
        );
        
        if (result) {
          console.log(`  - Released ${qty} units of product ${productId} (new reserved: ${result.reservedQuantity})`);
        }
      }
      
      // Update order status if still in hold
      if (order.status === "hold") {
        order.status = "expired";
        order.trackingHistory.push({
          status: "cancelled",
          timestamp: new Date(),
          note: "Order hold expired - cleaned up by maintenance script"
        });
        await order.save();
        console.log(`  - Updated order status to expired`);
      }
    }
    
    // 3. Find all products with reservedQuantity > 0 and check if there are active holds
    const productsWithReservations = await Product.find({
      reservedQuantity: { $gt: 0 }
    });
    
    console.log(`\nFound ${productsWithReservations.length} products with reservedQuantity > 0`);
    
    for (const product of productsWithReservations) {
      // Count active holds for this product
      const activeHolds = await Order.find({
        status: "hold",
        expiresAt: { $gt: now },
        "products.product": product._id
      });
      
      // Calculate expected reserved quantity from active holds
      let expectedReserved = 0;
      for (const hold of activeHolds) {
        const productInOrder = hold.products.find(p => p.product.toString() === product._id.toString());
        if (productInOrder) {
          expectedReserved += productInOrder.quantity;
        }
      }
      
      if (product.reservedQuantity !== expectedReserved) {
        console.log(`\nProduct ${product._id} (${product.name}):`);
        console.log(`  - Current reservedQuantity: ${product.reservedQuantity}`);
        console.log(`  - Expected from active holds: ${expectedReserved}`);
        console.log(`  - Active holds: ${activeHolds.length}`);
        console.log(`  - Correcting...`);
        
        product.reservedQuantity = expectedReserved;
        await product.save();
        
        console.log(`  ✓ Corrected to ${expectedReserved}`);
      }
    }
    
    console.log("\n✅ Cleanup completed successfully!");
    process.exit(0);
    
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
};

cleanupStuckReservations();
