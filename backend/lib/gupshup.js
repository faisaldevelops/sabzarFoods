/**
 * Gupshup WhatsApp API Service
 * 
 * Sends messages via Gupshup WhatsApp Business API
 */

const GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg";
const GUPSHUP_USERID = process.env.GUPSHUP_USERID;
const GUPSHUP_PASSWORD = process.env.GUPSHUP_PASSWORD;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;
const GUPSHUP_OTP_TEMPLATE = process.env.GUPSHUP_OTP_TEMPLATE; // Template name for OTP messages
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER; // Your WhatsApp Business number

/**
 * Format phone number to include country code
 * @param {string} phone - Phone number (10 digits)
 * @returns {string} - Phone with 91 prefix
 */
export const formatPhoneNumber = (phone) => {
	let cleaned = phone.replace(/\D/g, "");
	if (cleaned.startsWith("0")) {
		cleaned = cleaned.substring(1);
	}
	if (cleaned.length === 10) {
		cleaned = "91" + cleaned;
	}
	return cleaned;
};

/**
 * Send OTP via WhatsApp using Gupshup Template Message
 * Uses pre-approved template for reliable delivery
 * @param {string} phoneNumber - 10-digit phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
	try {
		const formattedPhone = formatPhoneNumber(phoneNumber);
		
		// Use template-based API for OTP (more reliable, works without prior user message)
		const templateApiUrl = "https://api.gupshup.io/wa/api/v1/template/msg";
		
		// Template message payload
		// The template should have a variable placeholder like {{1}} for the OTP
		const templateMessage = {
			id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
			to: formattedPhone,
			source: GUPSHUP_SOURCE_NUMBER,
			template: JSON.stringify({
				id: GUPSHUP_OTP_TEMPLATE,
				params: [otp] // OTP value goes into {{1}} placeholder
			})
		};

		const response = await fetch(templateApiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"apikey": GUPSHUP_PASSWORD,
			},
			body: new URLSearchParams({
				source: GUPSHUP_SOURCE_NUMBER,
				destination: formattedPhone,
				template: JSON.stringify({
					id: GUPSHUP_OTP_TEMPLATE,
					params: [otp]
				}),
				"src.name": GUPSHUP_APP_NAME
			}).toString(),
		});

		const data = await response.json();
		
		if (response.ok && (data.status === "submitted" || data.messageId)) {
			console.log(`OTP sent to ${formattedPhone} via Gupshup WhatsApp template`);
			return { success: true };
		} else {
			console.error("Gupshup template API error:", data);
			// Fall back to session message if template fails
			return await sendWhatsAppSessionOTP(phoneNumber, otp);
		}
	} catch (error) {
		console.error("Error sending WhatsApp OTP via template:", error);
		// Fall back to session message
		return await sendWhatsAppSessionOTP(phoneNumber, otp);
	}
};

/**
 * Send OTP via WhatsApp Session Message (fallback)
 * Only works if user has messaged within 24 hours
 * @param {string} phoneNumber - 10-digit phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
const sendWhatsAppSessionOTP = async (phoneNumber, otp) => {
	try {
		const formattedPhone = formatPhoneNumber(phoneNumber);
		
		const message = `Your SabzarFoods verification code is: *${otp}*

This code expires in 5 minutes. Do not share this code with anyone.`;
		
		const response = await fetch(GUPSHUP_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"apikey": GUPSHUP_PASSWORD,
			},
			body: new URLSearchParams({
				channel: "whatsapp",
				source: GUPSHUP_SOURCE_NUMBER,
				destination: formattedPhone,
				message: JSON.stringify({
					type: "text",
					text: message
				}),
				"src.name": GUPSHUP_APP_NAME
			}).toString(),
		});

		const data = await response.json();
		
		if (response.ok && (data.status === "submitted" || data.messageId)) {
			console.log(`OTP sent to ${formattedPhone} via Gupshup WhatsApp session`);
			return { success: true };
		} else {
			console.error("Gupshup session API error:", data);
			return {
				success: false,
				error: data.message || "Failed to send OTP",
			};
		}
	} catch (error) {
		console.error("Error sending WhatsApp session OTP:", error);
		return {
			success: false,
			error: error.message || "Failed to send OTP",
		};
	}
};

/**
 * Send a general WhatsApp message via Gupshup
 * @param {string} phoneNumber - 10-digit phone number
 * @param {string} message - Message to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppMessage = async (phoneNumber, message) => {
	try {
		const formattedPhone = formatPhoneNumber(phoneNumber);
		
		const params = new URLSearchParams();
		params.append("userid", GUPSHUP_USERID);
		params.append("password", GUPSHUP_PASSWORD);
		params.append("send_to", formattedPhone);
		params.append("v", "1.1");
		params.append("format", "json");
		params.append("msg_type", "TEXT");
		params.append("method", "SENDMESSAGE");
		params.append("msg", message);
		params.append("isTemplate", "false");
		
		if (GUPSHUP_APP_NAME) {
			params.append("auth_scheme", "plain");
		}

		const response = await fetch(GUPSHUP_API_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params.toString(),
		});

		const data = await response.json();
		
		if (response.ok && data.response?.status === "success") {
			console.log(`WhatsApp message sent to ${formattedPhone}`);
			return { success: true };
		} else {
			console.error("Gupshup API error:", data);
			return {
				success: false,
				error: data.response?.details || data.message || "Failed to send message",
			};
		}
	} catch (error) {
		console.error("Error sending WhatsApp message:", error);
		return {
			success: false,
			error: error.message || "Failed to send message",
		};
	}
};

/**
 * Check if Gupshup is configured
 * @returns {boolean}
 */
export const isGupshupConfigured = () => {
	return !!(GUPSHUP_USERID && GUPSHUP_PASSWORD);
};

export default {
	sendWhatsAppOTP,
	sendWhatsAppMessage,
	formatPhoneNumber,
	isGupshupConfigured,
};
