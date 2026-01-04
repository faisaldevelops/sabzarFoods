import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const isProd = process.env.NODE_ENV === "production";

const generateTokens = (userId) => {
	const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
		expiresIn: "60d",
	});

	const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: "60d",
	});

	return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
	await redis.set(`refresh_token:${userId}`, refreshToken, "EX", 60 * 24 * 60 * 60); // 60 days
};

const setCookies = (res, accessToken, refreshToken) => {
	res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: isProd,
		sameSite: "lax",
		domain: isProd ? ".sabzarfoods.in" : undefined, 
		maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: isProd,
		sameSite: "lax",
		domain: isProd ? ".sabzarfoods.in" : undefined, 
		path: "/api/auth/refresh-token",
		maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
	});
};

export const signup = async (req, res) => {
	const { email, password, name } = req.body;
	try {
		const userExists = await User.findOne({ email });

		if (userExists) {
			return res.status(400).json({ message: "User already exists" });
		}
		const user = await User.create({ name, email, password });

		// authenticate
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);

		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in signup controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const login = async (req, res) => {
	try {
		const { email, password } = req.body;
		// Include password field explicitly since it has select: false in the schema
		const user = await User.findOne({ email }).select('+password');

		if (user && (await user.comparePassword(password))) {
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);

			res.json({
				_id: user._id,
				name: user.name,
				email: user.email,
				role: user.role,
			});
		} else {
			res.status(400).json({ message: "Invalid email or password" });
		}
	} catch (error) {
		console.log("Error in login controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

export const logout = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;
		if (refreshToken) {
			const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
			await redis.del(`refresh_token:${decoded.userId}`);
		}

		res.clearCookie("accessToken", {
			httpOnly: true,
			secure: isProd,
			domain: isProd ? ".sabzarfoods.in" : undefined,
			sameSite: isProd ? "none" : "lax"
		});
		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: isProd,
			domain: isProd ? ".sabzarfoods.in" : undefined,
			sameSite: isProd ? "none" : "lax",
			path: "/api/auth/refresh-token"
		});
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// this will refresh the access token
export const refreshToken = async (req, res) => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			return res.status(401).json({ message: "No refresh token provided" });
		}

		const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "60d" });

		res.cookie("accessToken", accessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: isProd ? "none" : "lax",
			maxAge: 60 * 24 * 60 * 60 * 1000,
		});

		res.json({ message: "Token refreshed successfully" });
	} catch (error) {
		console.log("Error in refreshToken controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProfile = async (req, res) => {
	try {
		res.json(req.user);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createGuestUser = async (req, res) => {
	const { phoneNumber, email, name } = req.body;
	try {
		if (!phoneNumber || !name) {
			return res.status(400).json({ message: "Phone number and name are required" });
		}

		// Check if user already exists with this phone number
		let user = await User.findOne({ phoneNumber });
		
		if (user) {
			// User already exists, return existing user
			const { accessToken, refreshToken } = generateTokens(user._id);
			await storeRefreshToken(user._id, refreshToken);
			setCookies(res, accessToken, refreshToken);
			
			return res.status(200).json({
				_id: user._id,
				name: user.name,
				email: user.email,
				phoneNumber: user.phoneNumber,
				role: user.role,
				isGuest: user.isGuest,
			});
		}

		// Create new guest user
		user = await User.create({ 
			name, 
			phoneNumber,
			email: email || undefined,
			isGuest: true,
		});

		// Authenticate guest user
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.status(201).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			phoneNumber: user.phoneNumber,
			role: user.role,
			isGuest: user.isGuest,
		});
	} catch (error) {
		console.log("Error in createGuestUser controller", error.message);
		res.status(500).json({ message: error.message });
	}
};

/**
 * Get user's WhatsApp notification preference
 * GET /api/auth/whatsapp-preferences
 */
export const getWhatsAppPreferences = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select('whatsappNotifications whatsappOptInAt whatsappOptedOut whatsappOptOutAt phoneNumber email');
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		res.json({
			phoneNumber: user.phoneNumber,
			email: user.email || null,
			whatsappNotifications: user.whatsappNotifications !== false, // Default true
			optedOut: user.whatsappOptedOut || false,
			optedInAt: user.whatsappOptInAt || null,
			optedOutAt: user.whatsappOptOutAt || null,
		});
	} catch (error) {
		console.error("Error getting WhatsApp preferences:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Update user's WhatsApp notification preference
 * PUT /api/auth/whatsapp-preferences
 * 
 * FLOW:
 * - WhatsApp is ON by default (primary notification channel)
 * - If user opts OUT, they MUST provide an email for fallback notifications
 * - Records timestamps for compliance audit trail
 */
export const updateWhatsAppPreferences = async (req, res) => {
	try {
		const { whatsappNotifications, email } = req.body;
		const user = await User.findById(req.user._id);
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		if (typeof whatsappNotifications !== "boolean") {
			return res.status(400).json({ message: "whatsappNotifications must be a boolean" });
		}

		// If opting OUT of WhatsApp, require email for fallback notifications
		if (whatsappNotifications === false) {
			// Check if email is provided in request or user already has one
			const userEmail = email || user.email;
			
			if (!userEmail) {
				return res.status(400).json({ 
					message: "Email is required to opt out of WhatsApp notifications",
					requiresEmail: true
				});
			}
			
			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(userEmail)) {
				return res.status(400).json({ message: "Invalid email format" });
			}
			
			// Update email if new one provided
			if (email && email !== user.email) {
				user.email = email;
			}
			
			// Mark as opted out
			user.whatsappNotifications = false;
			user.whatsappOptedOut = true;
			user.whatsappOptOutAt = new Date();
			
		} else {
			// Opting IN to WhatsApp
			const wasOptedIn = user.whatsappNotifications;
			user.whatsappNotifications = true;
			user.whatsappOptedOut = false;
			
			// Record opt-in timestamp
			if (!wasOptedIn) {
				user.whatsappOptInAt = new Date();
				user.whatsappOptInSource = "profile";
			}
		}

		await user.save();

		res.json({
			message: user.whatsappNotifications 
				? "WhatsApp notifications enabled" 
				: "WhatsApp notifications disabled - you will receive updates via email",
			whatsappNotifications: user.whatsappNotifications,
			email: user.email,
			optedInAt: user.whatsappOptInAt,
			optedOutAt: user.whatsappOptOutAt,
		});
	} catch (error) {
		console.error("Error updating WhatsApp preferences:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

/**
 * Opt-in to WhatsApp notifications during checkout
 * POST /api/auth/whatsapp-optin-checkout
 * 
 * This endpoint is for checkout flow where user can
 * opt-in to notifications in a single action.
 */
export const optInAtCheckout = async (req, res) => {
	try {
		const { whatsappOptIn } = req.body;
		
		// Get user from request (could be authenticated or guest)
		let user;
		if (req.user) {
			user = await User.findById(req.user._id);
		} else {
			// For guest checkout, find by phone number if provided
			const { phoneNumber } = req.body;
			if (phoneNumber) {
				user = await User.findOne({ phoneNumber });
			}
		}
		
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}

		// Only process if opting in (not opting out via this endpoint)
		if (whatsappOptIn === true && !user.whatsappNotifications) {
			user.whatsappNotifications = true;
			user.whatsappOptInAt = new Date();
			user.whatsappOptInSource = "checkout";
			await user.save();
		}

		res.json({
			success: true,
			message: "Preferences saved",
			whatsappNotifications: user.whatsappNotifications || false
		});
	} catch (error) {
		console.error("Error in checkout opt-in:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Export helper functions for OTP controller
export { generateTokens, storeRefreshToken, setCookies };
