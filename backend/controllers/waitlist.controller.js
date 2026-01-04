import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

// Gupshup WhatsApp configuration
const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER;
const GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg";

const isGupshupConfigured = !!(GUPSHUP_API_KEY && GUPSHUP_SOURCE_NUMBER);

/**
 * Send WhatsApp notification via Gupshup
 */
const sendWhatsAppNotification = async (phoneNumber, message, templateName = null, templateParams = []) => {
	if (!isGupshupConfigured) {
		console.log(`[DEV MODE] WhatsApp to ${phoneNumber}: ${message}`);
		return true;
	}

	try {
		const formattedPhone = phoneNumber.startsWith("91") ? phoneNumber : `91${phoneNumber}`;
		
		let messagePayload;
		
		if (templateName) {
			// Use template message
			messagePayload = {
				type: "template",
				template: {
					name: templateName,
					language: { code: "en" },
					components: [
						{
							type: "body",
							parameters: templateParams.map(text => ({ type: "text", text }))
						}
					]
				}
			};
		} else {
			// Use text message (only works within 24-hour session window)
			messagePayload = {
				type: "text",
				text: message
			};
		}

		const formData = new URLSearchParams();
		formData.append("channel", "whatsapp");
		formData.append("source", GUPSHUP_SOURCE_NUMBER);
		formData.append("destination", formattedPhone);
		formData.append("message", JSON.stringify(messagePayload));
		
		if (GUPSHUP_APP_NAME) {
			formData.append("src.name", GUPSHUP_APP_NAME);
		}

		const response = await fetch(GUPSHUP_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"apikey": GUPSHUP_API_KEY,
			},
			body: formData.toString(),
		});

		const responseData = await response.json();

		if (response.ok && responseData.status === "submitted") {
			return true;
		} else {
			console.error("Gupshup notification error:", responseData);
			return false;
		}
	} catch (error) {
		console.error("Error sending WhatsApp notification:", error);
		return false;
	}
};

// TTL for waitlist entries (30 days in seconds)
const WAITLIST_TTL = 30 * 24 * 60 * 60;

/**
 * Add user to product waitlist
 * POST /api/products/:id/waitlist
 */
export const addToWaitlist = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { phoneNumber } = req.body;

		if (!phoneNumber) {
			return res.status(400).json({
				success: false,
				message: "Phone number is required"
			});
		}

		// Validate phone number format (10 digits)
		const phoneRegex = /^\d{10}$/;
		if (!phoneRegex.test(phoneNumber)) {
			return res.status(400).json({
				success: false,
				message: "Invalid phone number format. Must be 10 digits."
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

		// Use phone number as unique identifier
		const waitlistKey = `waitlist:${productId}`;

		// Check if user is already on the waitlist
		const existingEntry = await redis.hget(waitlistKey, phoneNumber);
		if (existingEntry) {
			return res.status(200).json({
				success: true,
				message: "You are already on the waitlist for this product",
				alreadySubscribed: true
			});
		}

		// Add user to waitlist with timestamp
		const waitlistData = JSON.stringify({
			phoneNumber,
			subscribedAt: new Date().toISOString(),
			productName: product.name
		});

		await redis.hset(waitlistKey, phoneNumber, waitlistData);
		
		// Set expiration on the waitlist hash (renew TTL)
		await redis.expire(waitlistKey, WAITLIST_TTL);

		return res.status(200).json({
			success: true,
			message: `You will be notified on WhatsApp when ${product.name} is back in stock`,
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
		const waitlist = Object.entries(waitlistData).map(([phoneNumber, data]) => {
			const parsed = JSON.parse(data);
			return {
				phoneNumber,
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
 * Uses Gupshup WhatsApp for notifications
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
		const waitlist = Object.entries(waitlistData).map(([phoneNumber, data]) => {
			const parsed = JSON.parse(data);
			return {
				phoneNumber
			};
		});

		console.log(`📱 Notifying ${waitlist.length} users about ${product.name} being back in stock`);
		
		let notifiedCount = 0;
		let failedCount = 0;

		// Send WhatsApp message to each user using Gupshup
		for (const user of waitlist) {
			if (user.phoneNumber) {
				try {
					const message = `🎉 Great news! ${product.name} is back in stock.\n\nOrder now before it sells out again!`;
					
					// Try to send using template (production) or text message (testing)
					// NOTE: Create a "back_in_stock" template in your Gupshup dashboard
					const templateName = process.env.GUPSHUP_BACK_IN_STOCK_TEMPLATE || null;
					
					const sent = await sendWhatsAppNotification(
						user.phoneNumber,
						message,
						templateName,
						templateName ? [product.name] : []
					);
					
					if (sent) {
						console.log(`  ✓ WhatsApp sent to ${user.phoneNumber}`);
						notifiedCount++;
					} else {
						console.log(`  ✗ Failed to send WhatsApp to ${user.phoneNumber}`);
						failedCount++;
					}
				} catch (error) {
					console.error(`  ✗ Failed to notify ${user.phoneNumber}:`, error.message);
					failedCount++;
				}
			}
		}

		// Clear the waitlist after notifying
		await redis.del(waitlistKey);

		console.log(`✓ Notified ${notifiedCount} users, ${failedCount} failed`);
		return { success: true, notified: notifiedCount, failed: failedCount };
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
		const { phoneNumber } = req.body;

		if (!phoneNumber) {
			return res.status(400).json({
				success: false,
				message: "Phone number is required"
			});
		}

		const waitlistKey = `waitlist:${productId}`;

		// Remove user from waitlist
		const removed = await redis.hdel(waitlistKey, phoneNumber);

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
