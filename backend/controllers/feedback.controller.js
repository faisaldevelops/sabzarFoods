/**
 * Feedback Controller
 * 
 * Handles anonymous feedback submissions with:
 * - Honeypot field detection (bot protection)
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
 * Submit feedback
 * Expects: { message, website (honeypot), _hp_time (timing honeypot) }
 */
export const submitFeedback = async (req, res) => {
  try {
    const { 
      message, 
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

    // === INPUT VALIDATION ===
    
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Please provide a message (at least 10 characters)" });
    }

    // === SANITIZE INPUTS ===
    
    const sanitizedMessage = sanitizeInput(message);
    const submittedAt = new Date().toISOString();
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
    const userAgent = sanitizeInput(req.headers['user-agent'] || 'Unknown');

    // === SEND EMAIL ===
    
    if (!isSESConfigured()) {
      console.error("SES not configured, cannot send feedback email");
      // Log to console as fallback
      console.log("=== FEEDBACK RECEIVED ===");
      console.log("Message:", sanitizedMessage);
      console.log("Time:", submittedAt);
      console.log("IP:", ip);
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
    .message { white-space: pre-wrap; padding: 15px; background: white; border-radius: 4px; margin-top: 10px; }
    .footer { text-align: center; padding: 15px; font-size: 12px; color: #78716c; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Feedback Received</h1>
    </div>
    <div class="content">
      <p><strong>Submitted At:</strong> ${submittedAt}</p>
      <div class="message">${sanitizedMessage}</div>
    </div>
    <div class="footer">
      <p>IP: ${ip}</p>
      <p>User Agent: ${userAgent}</p>
    </div>
  </div>
</body>
</html>
    `;

    const textBody = `
NEW FEEDBACK RECEIVED
=====================

${sanitizedMessage}

---
Submitted At: ${submittedAt}
IP: ${ip}
User Agent: ${userAgent}
    `;

    await sendEmail({
      to: feedbackEmail,
      subject: `[Feedback] New anonymous feedback`,
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
