import twilio from "twilio";
import crypto from "crypto";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import { generateTokens, storeRefreshToken, setCookies } from "./auth.controller.js";

// Redis key prefixes
const OTP_PREFIX = "otp:";
const THROTTLE_PREFIX = "otp_throttle:";
const FAILED_ATTEMPTS_PREFIX = "otp_failed:";

// Throttling configuration
const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // Minimum time between resends
const MAX_RESENDS_PER_WINDOW = 3; // Maximum resends allowed in the time window
const THROTTLE_WINDOW_SECONDS = 15 * 60; // 15 minutes
const MAX_FAILED_ATTEMPTS = 3; // Maximum failed OTP attempts
const FREEZE_DURATION_SECONDS = 15 * 60; // 15 minutes freeze

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
}

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Check if phone number is throttled
const checkThrottle = async (phoneNumber) => {
  const now = Date.now();
  const throttleKey = THROTTLE_PREFIX + phoneNumber;
  const throttleDataStr = await redis.get(throttleKey);

  if (!throttleDataStr) {
    return { allowed: true };
  }

  const throttleData = JSON.parse(throttleDataStr);

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
    const ttl = await redis.ttl(throttleKey);
    const resetInMinutes = Math.ceil(ttl / 60);
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
const updateThrottle = async (phoneNumber) => {
  const now = Date.now();
  const throttleKey = THROTTLE_PREFIX + phoneNumber;
  const throttleDataStr = await redis.get(throttleKey);

  if (!throttleDataStr) {
    // First request - create new throttle data
    const newData = {
      count: 1,
      lastSentAt: now,
    };
    await redis.setex(throttleKey, THROTTLE_WINDOW_SECONDS, JSON.stringify(newData));
  } else {
    // Increment count within existing window
    const throttleData = JSON.parse(throttleDataStr);
    throttleData.count += 1;
    throttleData.lastSentAt = now;
    
    // Get remaining TTL to preserve the original window
    const ttl = await redis.ttl(throttleKey);
    if (ttl > 0) {
      await redis.setex(throttleKey, ttl, JSON.stringify(throttleData));
    }
  }
};

// Check if phone number is frozen due to failed attempts
const checkFailedAttempts = async (phoneNumber) => {
  const failedKey = FAILED_ATTEMPTS_PREFIX + phoneNumber;
  const attemptDataStr = await redis.get(failedKey);

  if (!attemptDataStr) {
    return { allowed: true };
  }

  const attemptData = JSON.parse(attemptDataStr);

  // If frozen (attempts >= max), check remaining time
  if (attemptData.attempts >= MAX_FAILED_ATTEMPTS) {
    const ttl = await redis.ttl(failedKey);
    if (ttl > 0) {
      const remainingMinutes = Math.ceil(ttl / 60);
      return {
        allowed: false,
        reason: "frozen",
        remainingMinutes,
        message: `Too many failed attempts. Please try again in ${remainingMinutes} minute(s)`,
      };
    }
  }

  return { allowed: true };
};

// Record a failed OTP attempt
const recordFailedAttempt = async (phoneNumber) => {
  const failedKey = FAILED_ATTEMPTS_PREFIX + phoneNumber;
  const attemptDataStr = await redis.get(failedKey);

  let attemptData;
  if (!attemptDataStr) {
    attemptData = { attempts: 1 };
  } else {
    attemptData = JSON.parse(attemptDataStr);
    attemptData.attempts += 1;
  }

  // Set TTL based on whether we've hit the freeze threshold
  const ttl = attemptData.attempts >= MAX_FAILED_ATTEMPTS 
    ? FREEZE_DURATION_SECONDS 
    : OTP_EXPIRY_SECONDS; // Keep attempts alive as long as OTP could be valid

  await redis.setex(failedKey, ttl, JSON.stringify(attemptData));
  
  return attemptData;
};

// Clear failed attempts on successful verification
const clearFailedAttempts = async (phoneNumber) => {
  await redis.del(FAILED_ATTEMPTS_PREFIX + phoneNumber);
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
    const failedCheck = await checkFailedAttempts(phoneNumber);
    if (!failedCheck.allowed) {
      return res.status(429).json({
        message: failedCheck.message,
        reason: failedCheck.reason,
        remainingMinutes: failedCheck.remainingMinutes,
      });
    }

    // Check throttling
    const throttleCheck = await checkThrottle(phoneNumber);
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

    // Store OTP in Redis with TTL (auto-expires)
    const otpKey = OTP_PREFIX + phoneNumber;
    await redis.setex(otpKey, OTP_EXPIRY_SECONDS, JSON.stringify({ otp }));

    // Send OTP via Twilio or log to console
    await sendOTPMessage(phoneNumber, otp);

    // Update throttle data
    await updateThrottle(phoneNumber);

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
    const failedCheck = await checkFailedAttempts(phoneNumber);
    if (!failedCheck.allowed) {
      return res.status(429).json({
        message: failedCheck.message,
        reason: failedCheck.reason,
        remainingMinutes: failedCheck.remainingMinutes,
      });
    }

    // Check if OTP exists in Redis
    const otpKey = OTP_PREFIX + phoneNumber;
    const storedDataStr = await redis.get(otpKey);
    if (!storedDataStr) {
      return res.status(400).json({ message: "OTP not found or expired" });
    }

    const storedData = JSON.parse(storedDataStr);

    // Verify OTP
    if (storedData.otp !== otp) {
      const attemptData = await recordFailedAttempt(phoneNumber);
      const remainingAttempts = MAX_FAILED_ATTEMPTS - attemptData.attempts;
      
      if (remainingAttempts <= 0) {
        return res.status(429).json({ 
          message: `Too many failed attempts. Your number is frozen for ${Math.ceil(FREEZE_DURATION_SECONDS / 60)} minutes.`,
          reason: "frozen",
          remainingMinutes: Math.ceil(FREEZE_DURATION_SECONDS / 60),
        });
      }
      
      return res.status(400).json({ 
        message: "Invalid OTP",
        remainingAttempts,
      });
    }

    // OTP verified - delete it and clear throttle data and failed attempts
    await redis.del(otpKey);
    await redis.del(THROTTLE_PREFIX + phoneNumber);
    await clearFailedAttempts(phoneNumber);

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
    const otpKey = OTP_PREFIX + phoneNumber;
    const existingOTP = await redis.get(otpKey);
    if (!existingOTP) {
      return res.status(400).json({ message: "No OTP request found. Please request a new OTP first." });
    }

    // Check throttling
    const throttleCheck = await checkThrottle(phoneNumber);
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

    // Update OTP in Redis with fresh TTL
    await redis.setex(otpKey, OTP_EXPIRY_SECONDS, JSON.stringify({ otp }));

    // Send OTP via Twilio or log to console
    await sendOTPMessage(phoneNumber, otp);

    // Update throttle data
    await updateThrottle(phoneNumber);

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
