/**
 * Gupshup WhatsApp API Service
 * 
 * Sends template messages via Gupshup WhatsApp Business API
 * API Endpoint: https://api.gupshup.io/sm/api/v1/template/msg
 */

const GUPSHUP_TEMPLATE_API = "https://api.gupshup.io/sm/api/v1/template/msg";

const GUPSHUP_API_KEY = process.env.GUPSHUP_API_KEY;
const GUPSHUP_SOURCE_NUMBER = process.env.GUPSHUP_SOURCE_NUMBER; // Your WhatsApp Business number (e.g., 917834811114)
const GUPSHUP_OTP_TEMPLATE_ID = process.env.GUPSHUP_OTP_TEMPLATE_ID; // Template UUID for OTP

/**
 * Format phone number to include country code (E.164 format without +)
 * @param {string} phone - Phone number (10 digits)
 * @returns {string} - Phone with 91 prefix (e.g., 919876543210)
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
 * Template messages can be sent to any opted-in user (doesn't require 24-hour session)
 * 
 * @param {string} phoneNumber - 10-digit phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<{success: boolean, error?: string, messageId?: string}>}
 */
export const sendWhatsAppOTP = async (phoneNumber, otp) => {
	try {
		const formattedPhone = formatPhoneNumber(phoneNumber);
		
		const response = await fetch(GUPSHUP_TEMPLATE_API, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
				"apikey": GUPSHUP_API_KEY,
			},
			body: new URLSearchParams({
				source: GUPSHUP_SOURCE_NUMBER,
				destination: formattedPhone,
				template: JSON.stringify({
					id: GUPSHUP_OTP_TEMPLATE_ID,
					params: [otp] // OTP value goes into {{1}} placeholder
				})
			}).toString(),
		});

		const data = await response.json();
		
		if (response.ok && data.status === "submitted") {
			console.log(`OTP sent to ${formattedPhone} via Gupshup template. MessageId: ${data.messageId}`);
			return { success: true, messageId: data.messageId };
		} else {
			console.error("Gupshup template API error:", data);
			return {
				success: false,
				error: data.message || `Error code: ${data.code || 'unknown'}`,
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
 * Check if Gupshup is configured
 * @returns {boolean}
 */
export const isGupshupConfigured = () => {
	return !!(GUPSHUP_API_KEY && GUPSHUP_SOURCE_NUMBER && GUPSHUP_OTP_TEMPLATE_ID);
};

export default {
	sendWhatsAppOTP,
	formatPhoneNumber,
	isGupshupConfigured,
};
