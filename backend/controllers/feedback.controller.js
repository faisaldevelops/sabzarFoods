/**
 * Feedback Controller
 * 
 * Handles anonymous feedback submissions with:
 * - Honeypot field detection (bot protection)
 * - Simple checkbox verification with timing
 * - Input sanitization
 * - Email sending (no database storage)
 */

import { sendEmail, isSESConfigured } from "../lib/ses.js";

/**
 * Sanitize input to prevent XSS and injection attacks
 */
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  
  return str
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove potential script injections
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    // Trim whitespace
    .trim()
    // Limit length
    .substring(0, 5000);
}

/**
 * Validate email format
 */
function isValidEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Submit feedback
 * Expects: { name?, email?, feedbackType, message, notARobot, website (honeypot) }
 */
export const submitFeedback = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      feedbackType, 
      message, 
      notARobot,    // Simple checkbox
      website,      // Honeypot field - should be empty
      _hp_time      // Honeypot timing field - should be at least 3 seconds
    } = req.body;

    // === HONEYPOT CHECKS ===
    
    // Check honeypot field - bots often fill this
    if (website && website.trim() !== '') {
      console.log("Feedback rejected: honeypot field filled");
      // Return success to not alert the bot
      return res.json({ success: true, message: "Thank you for your feedback!" });
    }
    
    // Check timing honeypot - humans take at least 3 seconds to fill a form
    if (_hp_time) {
      const formTime = Date.now() - parseInt(_hp_time, 10);
      if (formTime < 3000) { // Less than 3 seconds
        console.log("Feedback rejected: form submitted too quickly");
        return res.json({ success: true, message: "Thank you for your feedback!" });
      }
    }

    // === CHECKBOX VERIFICATION ===
    
    if (!notARobot) {
      return res.status(400).json({ success: false, message: "Please confirm you're not a robot" });
    }

    // === INPUT VALIDATION ===
    
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a message (at least 10 characters)" });
    }
    
    if (!feedbackType) {
      return res.status(400).json({ success: false, message: "Please select a feedback type" });
    }
    
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address" });
    }

    // === SANITIZE INPUTS ===
    
    const sanitizedData = {
      name: sanitizeInput(name) || 'Anonymous',
      email: sanitizeInput(email) || 'Not provided',
      feedbackType: sanitizeInput(feedbackType),
      message: sanitizeInput(message),
      submittedAt: new Date().toISOString(),
      ip: req.ip || req.connection?.remoteAddress || 'Unknown',
      userAgent: sanitizeInput(req.headers['user-agent'] || 'Unknown')
    };

    // === SEND EMAIL ===
    
    if (!isSESConfigured()) {
      console.error("SES not configured, cannot send feedback email");
      // Log to console as fallback
      console.log("=== FEEDBACK RECEIVED ===");
      console.log(JSON.stringify(sanitizedData, null, 2));
      console.log("=========================");
      return res.json({ success: true, message: "Thank you for your feedback!" });
    }

    const feedbackEmail = "feedback@sabzarfoods.in";
    
    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1c1917; color: white; padding: 20px; text-align: center; }
    .content { background: #f5f5f4; padding: 20px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #57534e; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
    .message { white-space: pre-wrap; }
    .footer { text-align: center; padding: 15px; font-size: 12px; color: #78716c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Feedback Received</h1>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Feedback Type:</div>
        <div class="value">${sanitizedData.feedbackType}</div>
      </div>
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${sanitizedData.name}</div>
      </div>
      <div class="field">
        <div class="label">Email:</div>
        <div class="value">${sanitizedData.email}</div>
      </div>
      <div class="field">
        <div class="label">Message:</div>
        <div class="value message">${sanitizedData.message}</div>
      </div>
      <div class="field">
        <div class="label">Submitted At:</div>
        <div class="value">${sanitizedData.submittedAt}</div>
      </div>
    </div>
    <div class="footer">
      <p>IP: ${sanitizedData.ip}</p>
      <p>User Agent: ${sanitizedData.userAgent}</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
NEW FEEDBACK RECEIVED
=====================

Feedback Type: ${sanitizedData.feedbackType}
Name: ${sanitizedData.name}
Email: ${sanitizedData.email}

Message:
${sanitizedData.message}

---
Submitted At: ${sanitizedData.submittedAt}
IP: ${sanitizedData.ip}
User Agent: ${sanitizedData.userAgent}
    `;

    await sendEmail({
      to: feedbackEmail,
      subject: `[Feedback] ${sanitizedData.feedbackType} from ${sanitizedData.name}`,
      htmlBody,
      textBody
    });

    console.log(`Feedback email sent to ${feedbackEmail}`);
    
    return res.json({ success: true, message: "Thank you for your feedback! We appreciate you taking the time to share your thoughts." });
    
  } catch (error) {
    console.error("Error submitting feedback:", error);
    return res.status(500).json({ success: false, message: "Failed to submit feedback. Please try again later." });
  }
};
