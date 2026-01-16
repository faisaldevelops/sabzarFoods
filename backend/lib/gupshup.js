/**
 * Gupshup WhatsApp API Service
 * 
 * Sends messages via Gupshup WhatsApp Business API
 */

const GUPSHUP_API_URL = "https://api.gupshup.io/wa/api/v1/msg";
const GUPSHUP_USERID = process.env.GUPSHUP_USERID;
const GUPSHUP_PASSWORD = process.env.GUPSHUP_PASSWORD;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;

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
 * Send OTP via WhatsApp using Gupshup
 * @param {string} phoneNumber - 10-digit phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
	try {
		const formattedPhone = formatPhoneNumber(phoneNumber);
		
		const message = `Your SabzarFoods verification code is: *${otp}*

This code expires in 5 minutes. Do not share this code with anyone.`;
		
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
			console.log(`OTP sent to ${formattedPhone} via Gupshup WhatsApp`);
			return { success: true };
		} else {
			console.error("Gupshup API error:", data);
			return {
				success: false,
				error: data.response?.details || data.message || "Failed to send OTP",
			};
		}
	} catch (error) {
		console.error("Error sending WhatsApp OTP:", error);
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
