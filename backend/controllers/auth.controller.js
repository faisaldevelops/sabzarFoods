import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const isProd = process.env.NODE_ENV === "production";
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		domain: isProd ? ".sabzarfoods.in" : undefined,
		maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true,
		secure: isProd,
		sameSite: "lax",
		domain: isProd ? ".sabzarfoods.in" : undefined,
		path: "/api/auth/refresh-token",
		maxAge: 60 * 24 * 60 * 60 * 1000, // 60 days
	});
};

export const googleAuth = async (req, res) => {
	try {
		const { credential } = req.body;

		if (!credential) {
			return res.status(400).json({ message: "Google credential is required" });
		}

		// Verify the Google ID token
		const ticket = await googleClient.verifyIdToken({
			idToken: credential,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		const { sub: googleId, email, name, picture } = payload;

		// Find or create user
		let user = await User.findOne({ googleId });

		if (!user) {
			// Check if user exists with same email
			user = await User.findOne({ email });
			if (user) {
				// Link Google account to existing user
				user.googleId = googleId;
				user.picture = picture;
				await user.save();
			} else {
				// Create new user
				user = await User.create({
					googleId,
					email,
					name,
					picture,
				});
			}
		} else {
			// Update picture if changed
			if (user.picture !== picture) {
				user.picture = picture;
				await user.save();
			}
		}

		// Generate tokens and set cookies
		const { accessToken, refreshToken } = generateTokens(user._id);
		await storeRefreshToken(user._id, refreshToken);
		setCookies(res, accessToken, refreshToken);

		res.json({
			_id: user._id,
			name: user.name,
			email: user.email,
			picture: user.picture,
			role: user.role,
		});
	} catch (error) {
		console.log("Error in googleAuth controller", error.message);
		res.status(500).json({ message: "Authentication failed" });
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
			sameSite: isProd ? "none" : "lax",
		});
		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: isProd,
			domain: isProd ? ".sabzarfoods.in" : undefined,
			sameSite: isProd ? "none" : "lax",
			path: "/api/auth/refresh-token",
		});
		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.log("Error in logout controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

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

// Export helper functions for potential use elsewhere
export { generateTokens, storeRefreshToken, setCookies };
