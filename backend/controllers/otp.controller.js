import twilio from "twilio";
import crypto from "crypto";
import User from "../models/user.model.js";
import { generateTokens, storeRefreshToken, setCookies } from "./auth.controller.js";

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to phone number
export const sendOTP = async (req, res) => {
  try {
    const { phoneNumber, isSignup } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format. Must be 10 digits." });
    }

    // Check if user exists
    const userExists = await User.findOne({ phoneNumber });

    // Note: User enumeration trade-off
    // The following checks reveal account existence to prevent confusion during signup/login.
    // This is a deliberate UX decision per requirements, trading some security for better user experience.
    
    // Only enforce signup/login distinction when isSignup is explicitly provided
    // When isSignup is undefined (e.g., from checkout modal), allow both new and existing users
    if (isSignup !== undefined) {
      // If signup and user already exists, return error
      if (isSignup && userExists) {
        return res.status(400).json({ message: "Phone number already registered. Please login instead." });
      }

      // If logging in and user doesn't exist, return error
      if (!isSignup && !userExists) {
        return res.status(400).json({ message: "Phone number not registered. Please sign up first." });
      }
    }

    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(phoneNumber, { otp, expiresAt });

    // Send OTP via Twilio (if configured)
    if (twilioClient && twilioPhoneNumber) {
      try {
        await twilioClient.messages.create({
          body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
          from: twilioPhoneNumber,
          to: `+91${phoneNumber}`, // Assuming Indian phone numbers
        });
        console.log(`OTP sent to ${phoneNumber} via Twilio`);
      } catch (twilioError) {
        console.error("Twilio error:", twilioError);
        // Continue anyway for development/testing
      }
    } else {
      // For development/testing without Twilio
      console.log(`OTP for ${phoneNumber}: ${otp} (Development mode - not sent via SMS)`);
    }

    res.json({
      message: "OTP sent successfully",
      userExists: !!userExists,
      // In development, return OTP for testing (remove in production)
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};

// Verify OTP and login/signup user
export const verifyOTP = async (req, res) => {
  try {
    const { phoneNumber, otp, name } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ message: "Phone number and OTP are required" });
    }

    // Check if OTP exists
    const storedData = otpStore.get(phoneNumber);
    if (!storedData) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    // Check if OTP expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phoneNumber);
      return res.status(400).json({ message: "OTP expired" });
    }

    // Verify OTP
    if (storedData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // OTP verified - delete it
    otpStore.delete(phoneNumber);

    // Check if user exists
    let user = await User.findOne({ phoneNumber });
    let isNewUser = false;

    if (!user) {
      // Create new user
      if (!name) {
        return res.status(400).json({ message: "Name is required for new users" });
      }

      user = await User.create({
        name,
        phoneNumber,
        isGuest: false, // Not a guest since they authenticated
      });
      isNewUser = true;
    } else {
      // User exists - this is a login, not signup
      // Update name if provided and different
      if (name && name !== user.name) {
        user.name = name;
        await user.save();
      }
    }

    // Generate tokens and set cookies
    const { accessToken, refreshToken } = generateTokens(user._id);
    await storeRefreshToken(user._id, refreshToken);
    setCookies(res, accessToken, refreshToken);

    res.json({
      message: isNewUser ? "Account created successfully" : "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
      isNewUser,
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
};

// Export functions that auth controller needs
export { generateTokens, storeRefreshToken, setCookies };
