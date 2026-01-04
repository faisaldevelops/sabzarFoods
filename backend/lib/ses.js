/**
 * Amazon SES Email Service
 * Handles all email notifications for the e-commerce platform
 */
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize SES client
const sesClient = new SESClient({
	region: process.env.AWS_SES_REGION || "ap-south-1",
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

// Sender email (must be verified in SES)
const FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@sabzarfood.tv";
const BRAND_NAME = process.env.BRAND_NAME || "SabzarFood";

/**
 * Send email using Amazon SES
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content (fallback)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendEmail = async ({ to, subject, html, text }) => {
	try {
		// Validate required fields
		if (!to || !subject) {
			console.warn("[SES] Missing required email fields");
			return { success: false, error: "Missing required fields" };
		}

		// Check if SES is configured
		if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
			console.log("[SES] AWS credentials not configured - logging email instead");
			console.log(`[SES LOG] To: ${to}`);
			console.log(`[SES LOG] Subject: ${subject}`);
			console.log(`[SES LOG] Would send email...`);
			return { success: true, logged: true };
		}

		const command = new SendEmailCommand({
			Source: `${BRAND_NAME} <${FROM_EMAIL}>`,
			Destination: {
				ToAddresses: [to],
			},
			Message: {
				Subject: {
					Data: subject,
					Charset: "UTF-8",
				},
				Body: {
					Html: {
						Data: html || text,
						Charset: "UTF-8",
					},
					Text: {
						Data: text || html.replace(/<[^>]*>/g, ""),
						Charset: "UTF-8",
					},
				},
			},
		});

		const response = await sesClient.send(command);
		console.log(`[SES] Email sent successfully to ${to}, MessageId: ${response.MessageId}`);
		return { success: true, messageId: response.MessageId };
	} catch (error) {
		console.error("[SES] Error sending email:", error.message);
		return { success: false, error: error.message };
	}
};

/**
 * Generate base email template with consistent styling
 */
const baseTemplate = (content, preheader = "") => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BRAND_NAME}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .content {
      padding: 32px 24px;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #666666;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      color: #ffffff !important;
      padding: 14px 28px;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      margin: 16px 0;
    }
    .order-box {
      background-color: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .product-item {
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      padding: 12px 0;
    }
    .product-item:last-child {
      border-bottom: none;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }
    .status-processing { background-color: #fef3c7; color: #92400e; }
    .status-shipped { background-color: #dbeafe; color: #1e40af; }
    .status-delivered { background-color: #d1fae5; color: #065f46; }
    .preheader {
      display: none;
      font-size: 1px;
      color: #f4f4f4;
      line-height: 1px;
      max-height: 0;
      max-width: 0;
      opacity: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <span class="preheader">${preheader}</span>
  <div class="container">
    <div class="header">
      <h1>🍽️ ${BRAND_NAME}</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.</p>
      <p>If you have any questions, reply to this email or contact us.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send waitlist notification email
 * @param {string} email - Recipient email
 * @param {string} productName - Product name
 * @param {string} productId - Product ID for link
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendWaitlistNotification = async (email, productName, productId) => {
	const subject = `🎉 ${productName} is back in stock!`;
	const shopUrl = process.env.CLIENT_URL || "https://sabzarfood.tv";
	
	const content = `
		<h2 style="color: #059669; margin-bottom: 16px;">Great News! 🎉</h2>
		<p style="font-size: 16px; line-height: 1.6;">
			The product you've been waiting for is now back in stock!
		</p>
		
		<div class="order-box">
			<h3 style="margin: 0 0 8px 0; color: #047857;">${productName}</h3>
			<p style="margin: 0; color: #666;">Now available for purchase</p>
		</div>
		
		<p style="font-size: 16px; line-height: 1.6;">
			Don't miss out – grab yours before it's gone again!
		</p>
		
		<div style="text-align: center;">
			<a href="${shopUrl}/product/${productId}" class="button">
				Shop Now →
			</a>
		</div>
		
		<p style="font-size: 14px; color: #666; margin-top: 24px;">
			You received this email because you signed up for stock notifications on ${BRAND_NAME}.
		</p>
	`;
	
	return sendEmail({
		to: email,
		subject,
		html: baseTemplate(content, `${productName} is back in stock on ${BRAND_NAME}!`),
		text: `Great news! ${productName} is back in stock at ${BRAND_NAME}. Visit ${shopUrl} to shop now!`,
	});
};

/**
 * Send order confirmation email
 * @param {Object} options - Order details
 * @param {string} options.email - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.orderId - Public order ID
 * @param {Array} options.products - Array of products
 * @param {number} options.totalAmount - Total order amount
 * @param {Object} options.address - Delivery address
 * @param {number} options.deliveryFee - Delivery fee
 * @param {number} options.platformFee - Platform fee
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOrderConfirmation = async ({
	email,
	customerName,
	orderId,
	products,
	totalAmount,
	address,
	deliveryFee = 0,
	platformFee = 0,
}) => {
	const subject = `✅ Order Confirmed - #${orderId}`;
	const shopUrl = process.env.CLIENT_URL || "https://sabzarfood.tv";
	
	// Calculate subtotal
	const subtotal = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
	
	// Generate product list HTML
	const productListHtml = products.map(p => `
		<div style="display: table; width: 100%; padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
			<div style="display: table-cell; vertical-align: middle;">
				<strong style="color: #333;">${p.name}</strong>
				<div style="color: #666; font-size: 14px;">Qty: ${p.quantity}</div>
			</div>
			<div style="display: table-cell; vertical-align: middle; text-align: right; color: #059669; font-weight: 600;">
				₹${(p.price * p.quantity).toLocaleString('en-IN')}
			</div>
		</div>
	`).join('');
	
	const content = `
		<h2 style="color: #059669; margin-bottom: 8px;">Order Confirmed! ✅</h2>
		<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Hi ${customerName || 'there'},<br/>
			Thank you for your order! We're preparing it with care.
		</p>
		
		<div class="order-box">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
				<div>
					<div style="font-size: 12px; color: #666; text-transform: uppercase;">Order Number</div>
					<div style="font-size: 18px; font-weight: 700; color: #047857;">#${orderId}</div>
				</div>
				<span class="status-badge status-processing">Processing</span>
			</div>
		</div>
		
		<h3 style="margin-bottom: 12px; color: #333;">Order Items</h3>
		<div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
			${productListHtml}
			
			<div style="padding-top: 12px; margin-top: 12px; border-top: 2px solid #e5e7eb;">
				<div style="display: table; width: 100%; padding: 4px 0;">
					<span style="display: table-cell;">Subtotal</span>
					<span style="display: table-cell; text-align: right;">₹${subtotal.toLocaleString('en-IN')}</span>
				</div>
				${deliveryFee > 0 ? `
				<div style="display: table; width: 100%; padding: 4px 0;">
					<span style="display: table-cell;">Delivery</span>
					<span style="display: table-cell; text-align: right;">₹${deliveryFee.toLocaleString('en-IN')}</span>
				</div>
				` : ''}
				${platformFee > 0 ? `
				<div style="display: table; width: 100%; padding: 4px 0;">
					<span style="display: table-cell;">Convenience Fee</span>
					<span style="display: table-cell; text-align: right;">₹${platformFee.toLocaleString('en-IN')}</span>
				</div>
				` : ''}
				<div style="display: table; width: 100%; padding: 8px 0; font-size: 18px; font-weight: 700; border-top: 1px solid #e5e7eb; margin-top: 8px;">
					<span style="display: table-cell;">Total</span>
					<span style="display: table-cell; text-align: right; color: #059669;">₹${totalAmount.toLocaleString('en-IN')}</span>
				</div>
			</div>
		</div>
		
		<h3 style="margin: 24px 0 12px; color: #333;">Delivery Address</h3>
		<div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
			<p style="margin: 0; line-height: 1.6;">
				<strong>${address?.name || customerName}</strong><br/>
				${address?.houseNumber || ''} ${address?.streetAddress || ''}<br/>
				${address?.landmark ? `Near: ${address.landmark}<br/>` : ''}
				${address?.city || ''}, ${address?.state || ''} - ${address?.pincode || ''}<br/>
				📞 ${address?.phoneNumber || ''}
			</p>
		</div>
		
		<div style="text-align: center; margin-top: 24px;">
			<a href="${shopUrl}/orders" class="button">
				Track Your Order →
			</a>
		</div>
	`;
	
	return sendEmail({
		to: email,
		subject,
		html: baseTemplate(content, `Your order #${orderId} has been confirmed!`),
		text: `Order Confirmed! Hi ${customerName}, your order #${orderId} for ₹${totalAmount} has been placed successfully. We'll notify you when it ships.`,
	});
};

/**
 * Send order shipped notification
 * @param {Object} options - Order details
 * @param {string} options.email - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.orderId - Public order ID
 * @param {string} options.trackingNumber - Tracking number (optional)
 * @param {string} options.deliveryPartner - Delivery partner name (optional)
 * @param {string} options.estimatedDelivery - Estimated delivery date (optional)
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOrderShippedNotification = async ({
	email,
	customerName,
	orderId,
	trackingNumber,
	deliveryPartner,
	estimatedDelivery,
}) => {
	const subject = `🚚 Your Order #${orderId} Has Been Shipped!`;
	const shopUrl = process.env.CLIENT_URL || "https://sabzarfood.tv";
	
	const content = `
		<h2 style="color: #059669; margin-bottom: 8px;">Your Order is On Its Way! 🚚</h2>
		<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Hi ${customerName || 'there'},<br/>
			Great news! Your order has been shipped and is on its way to you.
		</p>
		
		<div class="order-box">
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
				<div>
					<div style="font-size: 12px; color: #666; text-transform: uppercase;">Order Number</div>
					<div style="font-size: 18px; font-weight: 700; color: #047857;">#${orderId}</div>
				</div>
				<span class="status-badge status-shipped">Shipped</span>
			</div>
			
			${trackingNumber ? `
			<div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #bbf7d0;">
				<div style="font-size: 12px; color: #666; text-transform: uppercase;">Tracking Number</div>
				<div style="font-size: 16px; font-weight: 600; color: #333; font-family: monospace;">${trackingNumber}</div>
			</div>
			` : ''}
			
			${deliveryPartner ? `
			<div style="margin-top: 12px;">
				<div style="font-size: 12px; color: #666; text-transform: uppercase;">Delivery Partner</div>
				<div style="font-size: 16px; font-weight: 600; color: #333;">${deliveryPartner}</div>
			</div>
			` : ''}
			
			${estimatedDelivery ? `
			<div style="margin-top: 12px;">
				<div style="font-size: 12px; color: #666; text-transform: uppercase;">Expected Delivery</div>
				<div style="font-size: 16px; font-weight: 600; color: #333;">${new Date(estimatedDelivery).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
			</div>
			` : ''}
		</div>
		
		<div style="text-align: center;">
			<a href="${shopUrl}/orders" class="button">
				Track Your Order →
			</a>
		</div>
		
		<p style="font-size: 14px; color: #666; margin-top: 24px; text-align: center;">
			Keep an eye out for our delivery – it's almost there!
		</p>
	`;
	
	return sendEmail({
		to: email,
		subject,
		html: baseTemplate(content, `Your order #${orderId} is on its way!`),
		text: `Your order #${orderId} has been shipped! ${trackingNumber ? `Tracking: ${trackingNumber}` : ''} ${estimatedDelivery ? `Expected by: ${estimatedDelivery}` : ''}`,
	});
};

/**
 * Send order delivered notification
 * @param {Object} options - Order details
 * @param {string} options.email - Customer email
 * @param {string} options.customerName - Customer name
 * @param {string} options.orderId - Public order ID
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendOrderDeliveredNotification = async ({
	email,
	customerName,
	orderId,
}) => {
	const subject = `✅ Your Order #${orderId} Has Been Delivered!`;
	const shopUrl = process.env.CLIENT_URL || "https://sabzarfood.tv";
	
	const content = `
		<h2 style="color: #059669; margin-bottom: 8px;">Order Delivered! 🎉</h2>
		<p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
			Hi ${customerName || 'there'},<br/>
			Your order has been successfully delivered! We hope you love it.
		</p>
		
		<div class="order-box">
			<div style="display: flex; justify-content: space-between; align-items: center;">
				<div>
					<div style="font-size: 12px; color: #666; text-transform: uppercase;">Order Number</div>
					<div style="font-size: 18px; font-weight: 700; color: #047857;">#${orderId}</div>
				</div>
				<span class="status-badge status-delivered">Delivered</span>
			</div>
		</div>
		
		<div style="background: #fef3c7; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
			<div style="font-size: 32px; margin-bottom: 8px;">⭐</div>
			<h3 style="margin: 0 0 8px 0; color: #92400e;">How was your experience?</h3>
			<p style="margin: 0; color: #78350f; font-size: 14px;">
				We'd love to hear your feedback! It helps us serve you better.
			</p>
		</div>
		
		<div style="text-align: center;">
			<a href="${shopUrl}" class="button">
				Shop Again →
			</a>
		</div>
		
		<p style="font-size: 14px; color: #666; margin-top: 24px; text-align: center;">
			Thank you for shopping with ${BRAND_NAME}! 💚
		</p>
	`;
	
	return sendEmail({
		to: email,
		subject,
		html: baseTemplate(content, `Your order #${orderId} has been delivered!`),
		text: `Your order #${orderId} has been delivered! Thank you for shopping with ${BRAND_NAME}. We hope you love your purchase!`,
	});
};

export default {
	sendEmail,
	sendWaitlistNotification,
	sendOrderConfirmation,
	sendOrderShippedNotification,
	sendOrderDeliveredNotification,
};

