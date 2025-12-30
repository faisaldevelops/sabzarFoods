/**
 * Migration Script: Add actualPrice to existing products
 * 
 * This script sets actualPrice = price for all products that don't have actualPrice set.
 * Run this once after deploying the dual pricing feature.
 * 
 * Usage:
 *   cd backend
 *   node scripts/migrateProductPrices.js
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

dotenv.config();

const migrateProductPrices = async () => {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find products without actualPrice or with actualPrice = null/undefined
    const productsToUpdate = await Product.find({
      $or: [
        { actualPrice: { $exists: false } },
        { actualPrice: null }
      ]
    });

    console.log(`\nFound ${productsToUpdate.length} products without actualPrice`);

    if (productsToUpdate.length === 0) {
      console.log("✅ No products need migration. All products already have actualPrice set.");
      await mongoose.disconnect();
      return;
    }

    // Preview the changes
    console.log("\nProducts to be updated:");
    console.log("─".repeat(60));
    productsToUpdate.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Current price: ₹${product.price}`);
      console.log(`   Will set actualPrice: ₹${product.price}`);
    });
    console.log("─".repeat(60));

    // Perform the update
    console.log("\nUpdating products...");
    
    const result = await Product.updateMany(
      {
        $or: [
          { actualPrice: { $exists: false } },
          { actualPrice: null }
        ]
      },
      [
        { $set: { actualPrice: "$price" } }
      ]
    );

    console.log(`\n✅ Migration complete!`);
    console.log(`   Matched: ${result.matchedCount} products`);
    console.log(`   Modified: ${result.modifiedCount} products`);

    // Verify the update
    const verifyCount = await Product.countDocuments({
      $or: [
        { actualPrice: { $exists: false } },
        { actualPrice: null }
      ]
    });

    if (verifyCount === 0) {
      console.log("\n✅ Verification passed: All products now have actualPrice set.");
    } else {
      console.log(`\n⚠️  Warning: ${verifyCount} products still don't have actualPrice.`);
    }

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
    
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  }
};

migrateProductPrices();

