import twilio from "twilio";
import crypto from "crypto";
import User from "../models/user.model.js";
import { generateTokens, storeRefreshToken, setCookies } from "./auth.controller.js";

// In-memory OTP storage (use Redis in production)
const otpStore = new Map();

// In-memory throttling storage for resend attempts
// Structure: { phoneNumber: { count: number, resetAt: timestamp, lastSentAt: timestamp } }
const throttleStore = new Map();

// In-memory storage for failed OTP attempts
// Structure: { phoneNumber: { attempts: number, freezeUntil: timestamp } }
const failedAttemptsStore = new Map();

// Throttling configuration
const RESEND_COOLDOWN_SECONDS = 60; // Minimum time between resends
const MAX_RESENDS_PER_WINDOW = 3; // Maximum resends allowed in the time window
const THROTTLE_WINDOW_MINUTES = 15; // Time window for tracking resends
const MAX_FAILED_ATTEMPTS = 3; // Maximum failed OTP attempts
const FREEZE_DURATION_MINUTES = 15; // Freeze duration after max failed attempts

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

// Check if phone number is throttled
const checkThrottle = (phoneNumber) => {
  const now = Date.now();
  const throttleData = throttleStore.get(phoneNumber);

  if (!throttleData) {
    return { allowed: true };
  }

  // Check if the throttle window has expired
  if (now > throttleData.resetAt) {
    // Reset the throttle data
    throttleStore.delete(phoneNumber);
    return { allowed: true };
  }

  // Check cooldown period
  const timeSinceLastSend = (now - throttleData.lastSentAt) / 1000;
  if (timeSinceLastSend < RESEND_COOLDOWN_SECONDS) {
    const waitTime = Math.ceil(RESEND_COOLDOWN_SECONDS - timeSinceLastSend);
    return {
      allowed: false,
      reason: "cooldown",
      waitTime,
      message: `Please wait ${waitTime} seconds before requesting another OTP`,
    };
  }

  // Check if max resends reached
  if (throttleData.count >= MAX_RESENDS_PER_WINDOW) {
    const resetInMinutes = Math.ceil((throttleData.resetAt - now) / 60000);
    return {
      allowed: false,
      reason: "limit_reached",
      resetInMinutes,
      message: `Too many OTP requests. Please try again in ${resetInMinutes} minute(s)`,
    };
  }

  return { allowed: true };
};

// Update throttle data after sending OTP
const updateThrottle = (phoneNumber) => {
  const now = Date.now();
  const throttleData = throttleStore.get(phoneNumber);

  if (!throttleData || now > throttleData.resetAt) {
    // First request or window expired - create new throttle data
    throttleStore.set(phoneNumber, {
      count: 1,
      resetAt: now + THROTTLE_WINDOW_MINUTES * 60 * 1000,
      lastSentAt: now,
    });
  } else {
    // Increment count within existing window
    throttleData.count += 1;
    throttleData.lastSentAt = now;
    throttleStore.set(phoneNumber, throttleData);
  }
};

// Check if phone number is frozen due to failed attempts
const checkFailedAttempts = (phoneNumber) => {
  const now = Date.now();
  const attemptData = failedAttemptsStore.get(phoneNumber);

  if (!attemptData) {
    return { allowed: true };
  }

  // Check if freeze period has expired
  if (attemptData.freezeUntil && now < attemptData.freezeUntil) {
    const remainingMinutes = Math.ceil((attemptData.freezeUntil - now) / 60000);
    return {
      allowed: false,
      reason: "frozen",
      remainingMinutes,
      message: `Too many failed attempts. Please try again in ${remainingMinutes} minute(s)`,
    };
  }

  // Freeze period expired, reset attempts
  if (attemptData.freezeUntil && now >= attemptData.freezeUntil) {
    failedAttemptsStore.delete(phoneNumber);
    return { allowed: true };
  }

  return { allowed: true };
};

// Record a failed OTP attempt
const recordFailedAttempt = (phoneNumber) => {
  const now = Date.now();
  const attemptData = failedAttemptsStore.get(phoneNumber);

  if (!attemptData) {
    failedAttemptsStore.set(phoneNumber, {
      attempts: 1,
      freezeUntil: null,
    });
  } else {
    attemptData.attempts += 1;
    
    if (attemptData.attempts >= MAX_FAILED_ATTEMPTS) {
      attemptData.freezeUntil = now + FREEZE_DURATION_MINUTES * 60 * 1000;
    }
    
    failedAttemptsStore.set(phoneNumber, attemptData);
  }
};

// Clear failed attempts on successful verification
const clearFailedAttempts = (phoneNumber) => {
  failedAttemptsStore.delete(phoneNumber);
};

// Send OTP via Twilio or log to console
const sendOTPMessage = async (phoneNumber, otp) => {
  if (twilioClient && twilioPhoneNumber) {
    try {
      await twilioClient.messages.create({
        body: `Your verification code is: ${otp}. Valid for 5 minutes.`,
        from: twilioPhoneNumber,
        to: `+91${phoneNumber}`, // Assuming Indian phone numbers
      });
      console.log(`OTP sent to ${phoneNumber} via Twilio`);
      return true;
    } catch (twilioError) {
      console.error("Twilio error:", twilioError);
      // Continue anyway for development/testing
      return false;
    }
  } else {
    // For development/testing without Twilio
    // console.log(`OTP for ${phoneNumber}: ${otp} (Development mode - not sent via SMS)`);
    return true;
  }
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

    // Check if phone number is frozen due to failed attempts
    const failedCheck = checkFailedAttempts(phoneNumber);
    if (!failedCheck.allowed) {
      return res.status(429).json({
        message: failedCheck.message,
        reason: failedCheck.reason,
        remainingMinutes: failedCheck.remainingMinutes,
      });
    }

    // Check throttling
    const throttleCheck = checkThrottle(phoneNumber);
    if (!throttleCheck.allowed) {
      return res.status(429).json({
        message: throttleCheck.message,
        reason: throttleCheck.reason,
        waitTime: throttleCheck.waitTime,
        resetInMinutes: throttleCheck.resetInMinutes,
      });
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

    // Send OTP via Twilio or log to console
    await sendOTPMessage(phoneNumber, otp);

    // Update throttle data
    updateThrottle(phoneNumber);

    res.json({
      message: "OTP sent successfully",
      userExists: !!userExists,
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

    // Check if phone number is frozen due to failed attempts
    const failedCheck = checkFailedAttempts(phoneNumber);
    if (!failedCheck.allowed) {
      return res.status(429).json({
        message: failedCheck.message,
        reason: failedCheck.reason,
        remainingMinutes: failedCheck.remainingMinutes,
      });
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
      recordFailedAttempt(phoneNumber);
      const attemptData = failedAttemptsStore.get(phoneNumber);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - attemptData.attempts;
      
      if (remainingAttempts <= 0) {
        return res.status(429).json({ 
          message: `Too many failed attempts. Your number is frozen for ${FREEZE_DURATION_MINUTES} minutes.`,
          reason: "frozen",
          remainingMinutes: FREEZE_DURATION_MINUTES,
        });
      }
      
      return res.status(400).json({ 
        message: "Invalid OTP",
        remainingAttempts,
      });
    }

    // OTP verified - delete it and clear throttle data and failed attempts
    otpStore.delete(phoneNumber);
    throttleStore.delete(phoneNumber);
    clearFailedAttempts(phoneNumber);

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

// Resend OTP to phone number
export const resendOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ message: "Invalid phone number format. Must be 10 digits." });
    }

    // Check if there's an existing OTP for this phone number
    const existingOTP = otpStore.get(phoneNumber);
    if (!existingOTP) {
      return res.status(400).json({ message: "No OTP request found. Please request a new OTP first." });
    }

    // Check throttling
    const throttleCheck = checkThrottle(phoneNumber);
    if (!throttleCheck.allowed) {
      return res.status(429).json({
        message: throttleCheck.message,
        reason: throttleCheck.reason,
        waitTime: throttleCheck.waitTime,
        resetInMinutes: throttleCheck.resetInMinutes,
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Update OTP in store
    otpStore.set(phoneNumber, { otp, expiresAt });

    // Send OTP via Twilio or log to console
    await sendOTPMessage(phoneNumber, otp);

    // Update throttle data
    updateThrottle(phoneNumber);

    res.json({
      message: "OTP resent successfully",
    });
  } catch (error) {
    console.error("Error resending OTP:", error);
    res.status(500).json({ message: "Failed to resend OTP", error: error.message });
  }
};

// Export functions that auth controller needs
export { generateTokens, storeRefreshToken, setCookies };
