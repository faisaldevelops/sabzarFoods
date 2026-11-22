import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import Product from "../models/product.model.js";
import { uploadToS3 } from "../lib/s3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

async function migrate() {
	const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
	if (!bucketName) {
		console.error("❌ ERROR: AWS_S3_BUCKET_NAME is not set in backend/.env!");
		console.error("Please add AWS_S3_BUCKET_NAME=<your-bucket-name> in backend/.env first.");
		process.exit(1);
	}

	const mongoUri = process.env.MONGO_URI;
	if (!mongoUri) {
		console.error("❌ ERROR: MONGO_URI is not set in backend/.env!");
		process.exit(1);
	}

	console.log("🔗 Connecting to MongoDB...");
	await mongoose.connect(mongoUri);
	console.log("✅ Connected to MongoDB.");

	try {
		console.log("🔍 Scanning products for Cloudinary images...");
		const products = await Product.find({
			image: { $regex: "res\\.cloudinary\\.com" },
		});

		console.log(`📦 Found ${products.length} product(s) with Cloudinary images.`);

		if (products.length === 0) {
			console.log("🎉 All products are already migrated to S3!");
			return;
		}

		let migratedCount = 0;
		let failedCount = 0;

		for (let i = 0; i < products.length; i++) {
			const product = products[i];
			const oldUrl = product.image;
			console.log(`\n[${i + 1}/${products.length}] Migrating: "${product.name}"`);
			console.log(`  Source: ${oldUrl}`);

			try {
				const response = await fetch(oldUrl);
				if (!response.ok) {
					throw new Error(`Failed to download image (HTTP ${response.status})`);
				}

				const arrayBuffer = await response.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				const contentType = response.headers.get("content-type") || "image/jpeg";

				const uploadResult = await uploadToS3(buffer, "products", contentType);
				console.log(`  Target: ${uploadResult.secure_url}`);

				product.image = uploadResult.secure_url;
				await product.save();

				migratedCount++;
				console.log(`  ✅ Successfully updated in database!`);
			} catch (err) {
				failedCount++;
				console.error(`  ❌ Failed to migrate "${product.name}":`, err.message);
			}
		}

		console.log("\n==========================================");
		console.log(` Migration Summary:`);
		console.log(`   Total Found:     ${products.length}`);
		console.log(`   Migrated to S3:  ${migratedCount}`);
		console.log(`   Failed:          ${failedCount}`);
		console.log("==========================================");
	} catch (error) {
		console.error("Fatal error during migration:", error);
	} finally {
		await mongoose.disconnect();
		console.log("👋 Disconnected from MongoDB.");
	}
}

migrate();
