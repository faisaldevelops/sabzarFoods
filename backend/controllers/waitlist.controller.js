import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

// TTL for waitlist entries (30 days in seconds)
const WAITLIST_TTL = 30 * 24 * 60 * 60;

/**
 * Add user to product waitlist
 * POST /api/products/:id/waitlist
 */
export const addToWaitlist = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { email, phoneNumber } = req.body;

		if (!email && !phoneNumber) {
			return res.status(400).json({
				success: false,
				message: "Either email or phone number is required"
			});
		}

		// Check if product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found"
			});
		}

		// Create unique identifier for the user
		const userId = email || phoneNumber;
		const waitlistKey = `waitlist:${productId}`;

		// Check if user is already on the waitlist
		const existingEntry = await redis.hget(waitlistKey, userId);
		if (existingEntry) {
			return res.status(200).json({
				success: true,
				message: "You are already on the waitlist for this product",
				alreadySubscribed: true
			});
		}

		// Add user to waitlist with timestamp
		const waitlistData = JSON.stringify({
			email: email || null,
			phoneNumber: phoneNumber || null,
			subscribedAt: new Date().toISOString(),
			productName: product.name
		});

		await redis.hset(waitlistKey, userId, waitlistData);
		
		// Set expiration on the waitlist hash (renew TTL)
		await redis.expire(waitlistKey, WAITLIST_TTL);

		return res.status(200).json({
			success: true,
			message: `You will be notified when ${product.name} is back in stock`,
			alreadySubscribed: false
		});
	} catch (error) {
		console.error("Error adding to waitlist:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to add to waitlist"
		});
	}
};

/**
 * Get waitlist for a product (admin only)
 * GET /api/products/:id/waitlist
 */
export const getWaitlist = async (req, res) => {
	try {
		const { id: productId } = req.params;

		// Check if product exists
		const product = await Product.findById(productId);
		if (!product) {
			return res.status(404).json({
				success: false,
				message: "Product not found"
			});
		}

		const waitlistKey = `waitlist:${productId}`;
		
		// Get all waitlist entries for this product
		const waitlistData = await redis.hgetall(waitlistKey);
		
		if (!waitlistData || Object.keys(waitlistData).length === 0) {
			return res.status(200).json({
				success: true,
				productId,
				productName: product.name,
				waitlist: [],
				count: 0
			});
		}

		// Parse and format waitlist entries
		const waitlist = Object.entries(waitlistData).map(([userId, data]) => {
			const parsed = JSON.parse(data);
			return {
				userId,
				email: parsed.email,
				phoneNumber: parsed.phoneNumber,
				subscribedAt: parsed.subscribedAt
			};
		});

		// Sort by subscribed date (oldest first)
		waitlist.sort((a, b) => new Date(a.subscribedAt) - new Date(b.subscribedAt));

		return res.status(200).json({
			success: true,
			productId,
			productName: product.name,
			waitlist,
			count: waitlist.length
		});
	} catch (error) {
		console.error("Error fetching waitlist:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to fetch waitlist"
		});
	}
};

/**
 * Notify waitlist users when product is back in stock
 * This would typically be called when stock is updated
 */
export const notifyWaitlist = async (productId) => {
	try {
		const waitlistKey = `waitlist:${productId}`;
		
		// Get all waitlist entries
		const waitlistData = await redis.hgetall(waitlistKey);
		
		if (!waitlistData || Object.keys(waitlistData).length === 0) {
			console.log(`No waitlist entries for product ${productId}`);
			return { success: true, notified: 0 };
		}

		const product = await Product.findById(productId);
		if (!product) {
			console.log(`Product ${productId} not found`);
			return { success: false, error: "Product not found" };
		}

		// Parse waitlist entries
		const waitlist = Object.entries(waitlistData).map(([userId, data]) => {
			const parsed = JSON.parse(data);
			return {
				userId,
				email: parsed.email,
				phoneNumber: parsed.phoneNumber
			};
		});

		console.log(`📧 Notifying ${waitlist.length} users about ${product.name} being back in stock`);
		
		// TODO: Implement actual notification logic here
		// This could be email, SMS, or push notifications
		// For now, we'll just log the notifications
		
		for (const user of waitlist) {
			if (user.email) {
				console.log(`  📧 Would send email to: ${user.email}`);
				// await sendEmail(user.email, 'Back in Stock', `${product.name} is now available!`);
			}
			if (user.phoneNumber) {
				console.log(`  📱 Would send SMS to: ${user.phoneNumber}`);
				// await sendSMS(user.phoneNumber, `${product.name} is now available!`);
			}
		}

		// Clear the waitlist after notifying
		await redis.del(waitlistKey);

		return { success: true, notified: waitlist.length };
	} catch (error) {
		console.error("Error notifying waitlist:", error);
		return { success: false, error: error.message };
	}
};

/**
 * Remove user from waitlist
 * DELETE /api/products/:id/waitlist
 */
export const removeFromWaitlist = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { email, phoneNumber } = req.body;

		if (!email && !phoneNumber) {
			return res.status(400).json({
				success: false,
				message: "Either email or phone number is required"
			});
		}

		const userId = email || phoneNumber;
		const waitlistKey = `waitlist:${productId}`;

		// Remove user from waitlist
		const removed = await redis.hdel(waitlistKey, userId);

		if (removed === 0) {
			return res.status(404).json({
				success: false,
				message: "You are not on the waitlist for this product"
			});
		}

		return res.status(200).json({
			success: true,
			message: "You have been removed from the waitlist"
		});
	} catch (error) {
		console.error("Error removing from waitlist:", error);
		return res.status(500).json({
			success: false,
			message: "Failed to remove from waitlist"
		});
	}
};
