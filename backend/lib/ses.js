/**
 * Amazon SES Email Service
 * 
 * This service handles sending transactional emails for order notifications
 * using Amazon Simple Email Service (SES).
 */

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// SES Configuration
const AWS_REGION = process.env.AWS_SES_REGION || "ap-south-1";
const FROM_EMAIL = process.env.AWS_SES_FROM_EMAIL || "noreply@example.com";
const FROM_NAME = process.env.AWS_SES_FROM_NAME || "Sabzar Foods";

// Initialize SES Client
let sesClient = null;

const getSESClient = () => {
  if (!sesClient) {
    sesClient = new SESClient({
      region: AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_SES_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SES_SECRET_ACCESS_KEY,
      },
    });
  }
  return sesClient;
};

/**
 * Check if SES is configured
 */
export const isSESConfigured = () => {
  return !!(
    process.env.AWS_SES_ACCESS_KEY_ID &&
    process.env.AWS_SES_SECRET_ACCESS_KEY &&
    process.env.AWS_SES_FROM_EMAIL
  );
};

/**
 * Send an email using SES
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.htmlBody - HTML content of the email
 * @param {string} params.textBody - Plain text content of the email
 */
export const sendEmail = async ({ to, subject, htmlBody, textBody }) => {
  console.log("[SES] Attempting to send email...");
  console.log(`[SES] Config check - ACCESS_KEY: ${process.env.AWS_SES_ACCESS_KEY_ID ? 'SET' : 'MISSING'}`);
  console.log(`[SES] Config check - SECRET_KEY: ${process.env.AWS_SES_SECRET_ACCESS_KEY ? 'SET' : 'MISSING'}`);
  console.log(`[SES] Config check - FROM_EMAIL: ${process.env.AWS_SES_FROM_EMAIL || 'MISSING'}`);
  console.log(`[SES] Config check - REGION: ${AWS_REGION}`);
  
  if (!isSESConfigured()) {
    console.log("[SES] Not configured, skipping email send");
    console.log(`[SES] Would send to: ${to}`);
    console.log(`[SES] Subject: ${subject}`);
    return { success: false, reason: "SES not configured" };
  }

  if (!to) {
    console.log("[SES] No recipient email provided, skipping");
    return { success: false, reason: "No recipient email" };
  }

  console.log(`[SES] Sending to: ${to}, Subject: ${subject}`);

  try {
    const client = getSESClient();
    
    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
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
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    });

    const response = await client.send(command);
    console.log(`[SES] Email sent successfully to ${to}, MessageId: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error(`[SES] Error sending email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Format currency for display in emails
 */
const formatCurrency = (amount) => {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

/**
 * Format date for display in emails
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

/**
 * Generate base email template
 */
const baseTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .header .logo {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .content {
      padding: 30px 20px;
    }
    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 20px;
    }
    .status-placed { background-color: #dbeafe; color: #1e40af; }
    .status-shipped { background-color: #fef3c7; color: #92400e; }
    .status-delivered { background-color: #dcfce7; color: #166534; }
    .order-info {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .order-info p {
      margin: 5px 0;
      font-size: 14px;
    }
    .order-info strong {
      color: #111827;
    }
    .products-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .products-table th {
      text-align: left;
      padding: 12px;
      background-color: #f3f4f6;
      border-bottom: 2px solid #e5e7eb;
      font-size: 14px;
      color: #374151;
    }
    .products-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 14px;
    }
    .totals {
      text-align: right;
      margin-top: 20px;
    }
    .totals p {
      margin: 5px 0;
      font-size: 14px;
    }
    .totals .grand-total {
      font-size: 18px;
      font-weight: 700;
      color: #16a34a;
      margin-top: 10px;
    }
    .address-box {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #16a34a;
      margin: 20px 0;
    }
    .address-box h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #6b7280;
      text-transform: uppercase;
    }
    .address-box p {
      margin: 3px 0;
      font-size: 14px;
    }
    .tracking-info {
      background-color: #fffbeb;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #fcd34d;
      margin: 20px 0;
    }
    .tracking-info h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #92400e;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: #16a34a;
      text-decoration: none;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
      color: white !important;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      ${content}
      <div class="footer">
        <p>Thank you for shopping with <strong>Sabzar Foods</strong>!</p>
        <p>If you have any questions, feel free to contact us.</p>
        <p style="margin-top: 15px;">
          <a href="https://sabzarfoods.com">sabzarfoods.com</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send Order Placed Email
 */
export const sendOrderPlacedEmail = async (order, userEmail) => {
  if (!userEmail) {
    console.log("[SES] No email address for order placed notification");
    return { success: false, reason: "No email address" };
  }

  const productRows = order.products
    .map(
      (p) => `
      <tr>
        <td>${p.product?.name || p.name || "Product"}</td>
        <td style="text-align: center;">${p.quantity}</td>
        <td style="text-align: right;">${formatCurrency(p.price)}</td>
        <td style="text-align: right;">${formatCurrency(p.price * p.quantity)}</td>
      </tr>
    `
    )
    .join("");

  const subtotal = order.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const deliveryFee = order.deliveryFee || 0;
  const platformFee = order.platformFee || 0;

  const htmlContent = `
    <div class="header">
      <div class="logo">🌿 Sabzar Foods</div>
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p style="text-align: center;">
        <span class="status-badge status-placed">✓ Order Placed Successfully</span>
      </p>
      
      <p>Hi ${order.address?.name || "there"},</p>
      <p>Thank you for your order! We're excited to prepare your items and get them shipped to you.</p>
      
      <div class="order-info">
        <p><strong>Order ID:</strong> #${order.publicOrderId}</p>
        <p><strong>Order Date:</strong> ${formatDate(order.createdAt || new Date())}</p>
      </div>
      
      <h3 style="margin-bottom: 10px;">Order Summary</h3>
      <table class="products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${productRows}
        </tbody>
      </table>
      
      <div class="totals">
        <p>Subtotal: <strong>${formatCurrency(subtotal)}</strong></p>
        ${deliveryFee > 0 ? `<p>Delivery Fee: <strong>${formatCurrency(deliveryFee)}</strong></p>` : ""}
        ${platformFee > 0 ? `<p>Platform Fee: <strong>${formatCurrency(platformFee)}</strong></p>` : ""}
        <p class="grand-total">Total: ${formatCurrency(order.totalAmount)}</p>
      </div>
      
      <div class="address-box">
        <h3>Delivery Address</h3>
        <p><strong>${order.address?.name || ""}</strong></p>
        <p>${order.address?.houseNumber || ""}, ${order.address?.streetAddress || ""}</p>
        ${order.address?.landmark ? `<p>Near: ${order.address.landmark}</p>` : ""}
        <p>${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}</p>
        <p>Phone: ${order.address?.phoneNumber || ""}</p>
      </div>
      
      <p style="text-align: center;">
        We'll send you another email when your order ships!
      </p>
    </div>
  `;

  const textContent = `
Order Confirmed! - Sabzar Foods

Hi ${order.address?.name || "there"},

Thank you for your order! We're excited to prepare your items and get them shipped to you.

Order ID: #${order.publicOrderId}
Order Date: ${formatDate(order.createdAt || new Date())}

Order Summary:
${order.products.map((p) => `- ${p.product?.name || p.name || "Product"} x${p.quantity} - ${formatCurrency(p.price * p.quantity)}`).join("\n")}

Subtotal: ${formatCurrency(subtotal)}
${deliveryFee > 0 ? `Delivery Fee: ${formatCurrency(deliveryFee)}` : ""}
${platformFee > 0 ? `Platform Fee: ${formatCurrency(platformFee)}` : ""}
Total: ${formatCurrency(order.totalAmount)}

Delivery Address:
${order.address?.name || ""}
${order.address?.houseNumber || ""}, ${order.address?.streetAddress || ""}
${order.address?.landmark ? `Near: ${order.address.landmark}` : ""}
${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}
Phone: ${order.address?.phoneNumber || ""}

We'll send you another email when your order ships!

Thank you for shopping with Sabzar Foods!
  `;

  return sendEmail({
    to: userEmail,
    subject: `Order Confirmed! #${order.publicOrderId} - Sabzar Foods`,
    htmlBody: baseTemplate(htmlContent, "Order Confirmed - Sabzar Foods"),
    textBody: textContent.trim(),
  });
};

/**
 * Send Order Shipped Email
 */
export const sendOrderShippedEmail = async (order, userEmail) => {
  if (!userEmail) {
    console.log("[SES] No email address for order shipped notification");
    return { success: false, reason: "No email address" };
  }

  const trackingInfo = order.trackingNumber
    ? `
      <div class="tracking-info">
        <h3>📦 Tracking Information</h3>
        <p><strong>Tracking Number:</strong> ${order.trackingNumber}</p>
        ${order.deliveryPartner ? `<p><strong>Courier:</strong> ${order.deliveryPartner === "india_post" ? "India Post" : "Delhivery"}</p>` : ""}
        ${order.estimatedDelivery ? `<p><strong>Expected Delivery:</strong> ${formatDate(order.estimatedDelivery)}</p>` : ""}
      </div>
    `
    : "";

  const htmlContent = `
    <div class="header">
      <div class="logo">🌿 Sabzar Foods</div>
      <h1>Your Order is On Its Way! 🚚</h1>
    </div>
    <div class="content">
      <p style="text-align: center;">
        <span class="status-badge status-shipped">📦 Shipped</span>
      </p>
      
      <p>Hi ${order.address?.name || "there"},</p>
      <p>Great news! Your order has been shipped and is on its way to you.</p>
      
      <div class="order-info">
        <p><strong>Order ID:</strong> #${order.publicOrderId}</p>
      </div>
      
      ${trackingInfo}
      
      <div class="address-box">
        <h3>Delivering To</h3>
        <p><strong>${order.address?.name || ""}</strong></p>
        <p>${order.address?.houseNumber || ""}, ${order.address?.streetAddress || ""}</p>
        ${order.address?.landmark ? `<p>Near: ${order.address.landmark}</p>` : ""}
        <p>${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}</p>
      </div>
      
      <p style="text-align: center;">
        We'll notify you when your order is delivered!
      </p>
    </div>
  `;

  const textContent = `
Your Order is On Its Way! - Sabzar Foods

Hi ${order.address?.name || "there"},

Great news! Your order has been shipped and is on its way to you.

Order ID: #${order.publicOrderId}

${order.trackingNumber ? `Tracking Number: ${order.trackingNumber}` : ""}
${order.deliveryPartner ? `Courier: ${order.deliveryPartner === "india_post" ? "India Post" : "Delhivery"}` : ""}
${order.estimatedDelivery ? `Expected Delivery: ${formatDate(order.estimatedDelivery)}` : ""}

Delivering To:
${order.address?.name || ""}
${order.address?.houseNumber || ""}, ${order.address?.streetAddress || ""}
${order.address?.landmark ? `Near: ${order.address.landmark}` : ""}
${order.address?.city || ""}, ${order.address?.state || ""} - ${order.address?.pincode || ""}

We'll notify you when your order is delivered!

Thank you for shopping with Sabzar Foods!
  `;

  return sendEmail({
    to: userEmail,
    subject: `Your Order #${order.publicOrderId} Has Been Shipped! 🚚`,
    htmlBody: baseTemplate(htmlContent, "Order Shipped - Sabzar Foods"),
    textBody: textContent.trim(),
  });
};

/**
 * Send Order Delivered Email
 */
export const sendOrderDeliveredEmail = async (order, userEmail) => {
  if (!userEmail) {
    console.log("[SES] No email address for order delivered notification");
    return { success: false, reason: "No email address" };
  }

  const htmlContent = `
    <div class="header">
      <div class="logo">🌿 Sabzar Foods</div>
      <h1>Your Order Has Been Delivered! 🎉</h1>
    </div>
    <div class="content">
      <p style="text-align: center;">
        <span class="status-badge status-delivered">✓ Delivered</span>
      </p>
      
      <p>Hi ${order.address?.name || "there"},</p>
      <p>Your order has been delivered! We hope you enjoy your products.</p>
      
      <div class="order-info">
        <p><strong>Order ID:</strong> #${order.publicOrderId}</p>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        We'd love to hear about your experience! If you have any feedback or questions about your order, please don't hesitate to reach out.
      </p>
      
      <p style="text-align: center; color: #6b7280;">
        Thank you for choosing Sabzar Foods. We look forward to serving you again!
      </p>
    </div>
  `;

  const textContent = `
Your Order Has Been Delivered! - Sabzar Foods

Hi ${order.address?.name || "there"},

Your order has been delivered! We hope you enjoy your products.

Order ID: #${order.publicOrderId}

We'd love to hear about your experience! If you have any feedback or questions about your order, please don't hesitate to reach out.

Thank you for choosing Sabzar Foods. We look forward to serving you again!
  `;

  return sendEmail({
    to: userEmail,
    subject: `Order Delivered! #${order.publicOrderId} 🎉 - Sabzar Foods`,
    htmlBody: baseTemplate(htmlContent, "Order Delivered - Sabzar Foods"),
    textBody: textContent.trim(),
  });
};

/**
 * Send order status email based on status
 */
export const sendOrderStatusEmail = async (order, userEmail, status) => {
  switch (status) {
    case "processing":
      // Order placed - send confirmation
      return sendOrderPlacedEmail(order, userEmail);
    case "shipped":
      return sendOrderShippedEmail(order, userEmail);
    case "delivered":
      return sendOrderDeliveredEmail(order, userEmail);
    default:
      console.log(`[SES] No email template for status: ${status}`);
      return { success: false, reason: `No template for status: ${status}` };
  }
};
