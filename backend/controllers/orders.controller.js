import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import twilio from "twilio";

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;
if (accountSid && authToken) {
	twilioClient = twilio(accountSid, authToken);
}

// Helper function to send SMS notification (currently logging instead of sending)
const sendOrderStatusSMS = async (phoneNumber, orderPublicId, status) => {
	try {
		let message = "";
		if (status === "shipped") {
			message = `Your order #${orderPublicId} has been shipped! Track your order to see delivery updates.`;
		} else if (status === "delivered") {
			message = `Your order #${orderPublicId} has been delivered! Thank you for shopping with us.`;
		} else {
			// Don't send SMS for other statuses
			return { success: false, reason: "Status not eligible for SMS" };
		}

		// Log SMS instead of sending (SMS sending disabled)
		console.log(`[SMS LOG] Would send SMS to ${phoneNumber} for order ${orderPublicId}`);
		console.log(`[SMS LOG] Message: ${message}`);
		console.log(`[SMS LOG] Status: ${status}`);
		
		// Original SMS sending code (commented out):
		// await twilioClient.messages.create({
		// 	body: message,
		// 	from: twilioPhoneNumber,
		// 	to: `+91${phoneNumber}`,
		// });

		return { success: true, logged: true };
	} catch (error) {
		console.error(`[SMS LOG] Error logging SMS for ${phoneNumber}:`, error.message);
		return { success: false, reason: error.message };
	}
};

export const getOrdersData = async (req, res) => {
	try {
		// Extract filter parameters from query
		const { phoneNumber, publicOrderId, status, page, limit } = req.query;
		
		// Pagination parameters
		const pageNumber = parseInt(page) || 1;
		const pageSize = parseInt(limit) || 10;
		const skip = (pageNumber - 1) * pageSize;
		
		// Build filter object
		let filter = {};
		
		// Filter by publicOrderId
		if (publicOrderId) {
			filter.publicOrderId = publicOrderId;
		}
		
		// Filter by status (trackingStatus)
		if (status && status !== 'all') {
			// Validate status is one of the allowed values
			const allowedStatuses = ['pending', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'];
			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ 
					success: false, 
					message: 'Invalid status value' 
				});
			}
			filter.trackingStatus = status;
		}
		
		// Filter by user phone number (not address)
		if (phoneNumber) {
			const sanitizedPhone = phoneNumber.replace(/[^0-9+\-\s()]/g, '');
			if (sanitizedPhone) {
				// Find user IDs matching phone number
				const User = mongoose.model('User');
				const users = await User.find({ phoneNumber: { $regex: sanitizedPhone, $options: 'i' } }, '_id');
				const userIds = users.map(u => u._id);
				if (userIds.length > 0) {
					filter.user = { $in: userIds };
				} else {
					// No users match, so no orders will match
					filter.user = null;
				}
			}
		}
		
		// Get total count for pagination
		const totalOrders = await Order.countDocuments(filter);
		const totalPages = Math.ceil(totalOrders / pageSize);
		
		// Find orders with filters, pagination, and populate the user and product references.
		// Sort by createdAt in ascending order (oldest first)
		const orders = await Order.find(filter)
			.populate('user', 'name email phoneNumber')
			.populate({
				path: 'products.product',
				select: 'name price image',
			})
			.sort({ createdAt: 1 }) // Sort by oldest first (ascending order)
			.skip(skip)
			.limit(pageSize)
			.lean();

		// Format each order to merge product details alongside quantity/price
		const formatted = orders.map(order => {
			const products = (order.products || []).map(p => {
				const prod = p.product;
				return {
					name: prod?.name ?? 'PRODUCT_REMOVED',
					price: prod?.price ?? p.price ?? null,
					image: prod?.image ?? null,
					category: prod?.category ?? null,
					quantity: p.quantity ?? 0,
				};
			});

			return {
				orderId: order._id,
				publicOrderId: order.publicOrderId,
				totalAmount: order.totalAmount ?? null,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt,
				user: order.user ? {
					userId: order.user._id,
					name: order.user.name,
					email: order.user.email,
					phoneNumber: order.user.phoneNumber,
				} : null,
				products,
				address: order.address,
				trackingStatus: order.trackingStatus,
				trackingNumber: order.trackingNumber,
				estimatedDelivery: order.estimatedDelivery,
				trackingHistory: order.trackingHistory,
			};
		});

		return res.json({ 
			success: true, 
			data: formatted,
			pagination: {
				currentPage: pageNumber,
				pageSize: pageSize,
				totalOrders: totalOrders,
				totalPages: totalPages,
				hasNextPage: pageNumber < totalPages,
				hasPrevPage: pageNumber > 1
			}
		});
	} catch (err) {
		console.error('Error fetching orders:', err);
		return res.status(500).json({ success: false, message: 'Server error fetching orders' });
	}
};

export const getUserOrders = async (req, res) => {
	try {
		// Extract pagination parameters from query
		const { page, limit } = req.query;
		
		// Pagination parameters
		const pageNumber = parseInt(page) || 1;
		const pageSize = parseInt(limit) || 4; // Default 4 orders per page
		const skip = (pageNumber - 1) * pageSize;
		
		// Get total count for pagination
		const totalOrders = await Order.countDocuments({ user: req.user._id });
		const totalPages = Math.ceil(totalOrders / pageSize);
		
		// Find orders with pagination, sorted by latest first (createdAt: -1)
		const orders = await Order.find({ user: req.user._id })
			.populate({
				path: 'products.product',
				select: 'name price image',
			})
			.sort({ createdAt: -1 }) // Latest orders first
			.skip(skip)
			.limit(pageSize)
			.lean();

		const formatted = orders.map(order => ({
			orderId: order._id,
			publicOrderId: order.publicOrderId,
			totalAmount: order.totalAmount,
			createdAt: order.createdAt,
			products: order.products.map(p => ({
				name: p.product?.name ?? 'PRODUCT_REMOVED',
				price: p.product?.price ?? p.price,
				image: p.product?.image,
				quantity: p.quantity,
			})),
			address: order.address,
			trackingStatus: order.trackingStatus,
			trackingNumber: order.trackingNumber,
			estimatedDelivery: order.estimatedDelivery,
			trackingHistory: order.trackingHistory,
		}));

		res.json({ 
			success: true, 
			data: formatted,
			pagination: {
				currentPage: pageNumber,
				pageSize: pageSize,
				totalOrders: totalOrders,
				totalPages: totalPages,
				hasNextPage: pageNumber < totalPages,
				hasPrevPage: pageNumber > 1
			}
		});
	} catch (error) {
		console.error('Error fetching user orders:', error);
		res.status(500).json({ success: false, message: 'Server error fetching user orders' });
	}
};

export const updateOrderTracking = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { trackingStatus, trackingNumber, estimatedDelivery, note } = req.body;

		const order = await Order.findById(orderId).populate('user', 'phoneNumber');
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		const previousStatus = order.trackingStatus;

		// Update tracking fields if provided
		if (trackingStatus && trackingStatus !== order.trackingStatus) {
			order.trackingStatus = trackingStatus;
			order.trackingHistory.push({
				status: trackingStatus,
				timestamp: new Date(),
				note: note || `Status updated to ${trackingStatus}`,
			});

			// Log SMS notification (instead of sending) for shipped and delivered statuses
			if ((trackingStatus === "shipped" || trackingStatus === "delivered") && order.user?.phoneNumber) {
				// Log SMS instead of sending (asynchronously, don't wait for it to complete)
				sendOrderStatusSMS(order.user.phoneNumber, order.publicOrderId, trackingStatus)
					.catch(error => console.error("[SMS LOG] SMS notification error:", error));
			}
		}

		if (trackingNumber !== undefined) {
			order.trackingNumber = trackingNumber;
		}

		if (estimatedDelivery !== undefined) {
			order.estimatedDelivery = estimatedDelivery;
		}

		await order.save();

		res.json({
			success: true,
			message: "Order tracking updated successfully",
			order: {
				orderId: order._id,
				publicOrderId: order.publicOrderId,
				trackingStatus: order.trackingStatus,
				trackingNumber: order.trackingNumber,
				estimatedDelivery: order.estimatedDelivery,
				trackingHistory: order.trackingHistory,
			},
		});
	} catch (error) {
		console.error('Error updating order tracking:', error);
		res.status(500).json({ success: false, message: 'Server error updating order tracking' });
	}
};

export const getOrderTracking = async (req, res) => {
	try {
		const { orderId } = req.params;
		const order = await Order.findById(orderId);

		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		// Check if user owns this order (unless admin)
		if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
			return res.status(403).json({ message: "Access denied" });
		}

		res.json({
			success: true,
			data: {
				orderId: order._id,
				publicOrderId: order.publicOrderId,
				trackingStatus: order.trackingStatus,
				trackingNumber: order.trackingNumber,
				estimatedDelivery: order.estimatedDelivery,
				trackingHistory: order.trackingHistory,
				createdAt: order.createdAt,
			},
		});
	} catch (error) {
		console.error('Error fetching order tracking:', error);
		res.status(500).json({ success: false, message: 'Server error fetching order tracking' });
	}
};

export const getAddressSheet = async (req, res) => {
	try {
		const { orderId } = req.params;
		
		const order = await Order.findById(orderId)
			.populate('user', 'name phoneNumber')
			.lean();

		if (!order) {
			return res.status(404).json({ success: false, message: "Order not found" });
		}

		const address = order.address || {};
		const user = order.user || {};

		// Generate HTML for printable address sheet
		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Address Sheet - Order #${order.publicOrderId}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: Arial, sans-serif;
			padding: 20px;
		}
		.address-sheet {
			width: 400px;
			border: 2px solid #000;
			padding: 20px;
			margin: 0 auto;
		}
		.header {
			text-align: center;
			border-bottom: 2px solid #000;
			padding-bottom: 10px;
			margin-bottom: 15px;
		}
		.order-id {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 5px;
		}
		.section {
			margin-bottom: 15px;
		}
		.label {
			font-weight: bold;
			font-size: 12px;
			color: #666;
			text-transform: uppercase;
			margin-bottom: 3px;
		}
		.value {
			font-size: 16px;
			margin-bottom: 8px;
			line-height: 1.4;
		}
		.name {
			font-size: 20px;
			font-weight: bold;
		}
		.phone {
			font-size: 18px;
			font-weight: bold;
		}
		.address-line {
			margin-bottom: 5px;
		}
		@media print {
			body {
				padding: 0;
			}
			.address-sheet {
				border: 2px solid #000;
			}
		}
	</style>
</head>
<body>
	<div class="address-sheet">
		<div class="header">
			<div class="order-id">Order #${order.publicOrderId || order._id}</div>
			<div style="font-size: 12px; color: #666;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
		</div>
		
		<div class="section">
			<div class="label">Deliver To:</div>
			<div class="value name">${address.name || user.name || 'N/A'}</div>
		</div>
		
		<div class="section">
			<div class="label">Phone:</div>
			<div class="value phone">${address.phoneNumber || user.phoneNumber || 'N/A'}</div>
		</div>
		
		<div class="section">
			<div class="label">Address:</div>
			<div class="value">
				<div class="address-line">${address.houseNumber || 'N/A'}, ${address.streetAddress || 'N/A'}</div>
				${address.landmark ? `<div class="address-line">Near: ${address.landmark}</div>` : ''}
				<div class="address-line">${address.city || 'N/A'}, ${address.state || 'N/A'}</div>
				<div class="address-line" style="font-weight: bold;">PIN: ${address.pincode || 'N/A'}</div>
			</div>
		</div>
	</div>
	
	<script>
		// Auto-print when page loads
		window.onload = function() {
			window.print();
		};
	</script>
</body>
</html>
		`;

		res.setHeader('Content-Type', 'text/html');
		res.send(html);
	} catch (err) {
		console.error('Error generating address sheet:', err);
		return res.status(500).json({ success: false, message: 'Server error generating address sheet' });
	}
};

export const getBulkAddressSheets = async (req, res) => {
	try {
		// Extract filter parameters from query
		const { phoneNumber, publicOrderId } = req.query;
		
		// Build filter object - ALWAYS filter by processing status only
		let filter = {
			trackingStatus: 'processing'
		};
		
		// Filter by publicOrderId (optional, but still only shows processing orders)
		if (publicOrderId) {
			filter.publicOrderId = publicOrderId;
		}
		
		// Filter by user phone number (optional)
		if (phoneNumber) {
			const sanitizedPhone = phoneNumber.replace(/[^0-9+\-\s()]/g, '');
			if (sanitizedPhone) {
				const User = mongoose.model('User');
				const users = await User.find({ phoneNumber: { $regex: sanitizedPhone, $options: 'i' } }, '_id');
				const userIds = users.map(u => u._id);
				if (userIds.length > 0) {
					filter.user = { $in: userIds };
				} else {
					filter.user = null;
				}
			}
		}
		
		// Find all orders matching filters (no pagination)
		// Sort by createdAt in ascending order (oldest first)
		const orders = await Order.find(filter)
			.populate('user', 'name phoneNumber')
			.sort({ createdAt: 1 })
			.lean();

		if (orders.length === 0) {
			return res.status(404).send(`
				<!DOCTYPE html>
				<html>
				<head>
					<meta charset="UTF-8">
					<title>No Orders Found</title>
					<style>
						body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
					</style>
				</head>
				<body>
					<h1>No orders found matching the current filters.</h1>
				</body>
				</html>
			`);
		}

		// Generate HTML for all address sheets, grouped into pages of 6
		const labelsPerPage = 6;
		const pages = [];
		
		for (let i = 0; i < orders.length; i += labelsPerPage) {
			const pageOrders = orders.slice(i, i + labelsPerPage);
			const isLastPage = i + labelsPerPage >= orders.length;
			
			const pageHTML = pageOrders.map(order => {
				const address = order.address || {};
				const user = order.user || {};
				
				return `
			<div class="address-sheet">
				<div class="header">
					<div class="order-id">Order #${order.publicOrderId || order._id}</div>
					<div style="font-size: 12px; color: #666;">Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
				</div>
				
				<div class="section">
					<div class="label">Deliver To:</div>
					<div class="value name">${address.name || user.name || 'N/A'}</div>
				</div>
				
				<div class="section">
					<div class="label">Phone:</div>
					<div class="value phone">${address.phoneNumber || user.phoneNumber || 'N/A'}</div>
				</div>
				
				<div class="section">
					<div class="label">Address:</div>
					<div class="value">
						<div class="address-line">${address.houseNumber || 'N/A'}, ${address.streetAddress || 'N/A'}</div>
						${address.landmark ? `<div class="address-line">Near: ${address.landmark}</div>` : ''}
						<div class="address-line">${address.city || 'N/A'}, ${address.state || 'N/A'}</div>
						<div class="address-line" style="font-weight: bold;">PIN: ${address.pincode || 'N/A'}</div>
					</div>
				</div>
			</div>
				`;
			}).join('');
			
			pages.push(`
		<div class="page-container" ${!isLastPage ? 'style="page-break-after: always;"' : ''}>
			${pageHTML}
		</div>
			`);
		}
		
		const addressSheetsHTML = pages.join('');

		const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>Bulk Address Sheets - ${orders.length} Order${orders.length !== 1 ? 's' : ''}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		body {
			font-family: Arial, sans-serif;
			padding: 10px;
		}
		.page-container {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-template-rows: repeat(2, 1fr);
			gap: 10px;
			width: 100%;
			height: 100vh;
			padding: 10px;
			page-break-inside: avoid;
		}
		.address-sheet {
			border: 2px solid #000;
			padding: 20px;
			display: flex;
			flex-direction: column;
			height: 100%;
			overflow: hidden;
		}
		.header {
			text-align: center;
			border-bottom: 2px solid #000;
			padding-bottom: 10px;
			margin-bottom: 15px;
		}
		.order-id {
			font-size: 18px;
			font-weight: bold;
			margin-bottom: 5px;
		}
		.section {
			margin-bottom: 15px;
		}
		.label {
			font-weight: bold;
			font-size: 12px;
			color: #666;
			text-transform: uppercase;
			margin-bottom: 3px;
		}
		.value {
			font-size: 16px;
			margin-bottom: 8px;
			line-height: 1.4;
		}
		.name {
			font-size: 20px;
			font-weight: bold;
		}
		.phone {
			font-size: 18px;
			font-weight: bold;
		}
		.address-line {
			margin-bottom: 5px;
		}
		@media print {
			body {
				padding: 0;
				margin: 0;
			}
			.page-container {
				width: 100%;
				height: 100vh;
				page-break-after: always;
				page-break-inside: avoid;
				margin: 0;
				padding: 8mm;
				gap: 5mm;
			}
			.page-container:last-child {
				page-break-after: auto;
			}
			.address-sheet {
				border: 2px solid #000;
				padding: 20px;
				page-break-inside: avoid;
			}
			@page {
				size: A4;
				margin: 0;
			}
		}
		@media screen {
			.page-container {
				min-height: 100vh;
				margin-bottom: 20px;
			}
		}
	</style>
</head>
<body>
	${addressSheetsHTML}
	<script>
		// Auto-print when page loads
		window.onload = function() {
			window.print();
		};
	</script>
</body>
</html>
		`;

		res.setHeader('Content-Type', 'text/html');
		res.send(html);
	} catch (err) {
		console.error('Error generating bulk address sheets:', err);
		return res.status(500).json({ success: false, message: 'Server error generating bulk address sheets' });
	}
};

export const exportOrdersCSV = async (req, res) => {
	try {
		// Extract filter parameters from query
		const { phoneNumber, publicOrderId, status } = req.query;
		
		// Build filter object (same as getOrdersData)
		let filter = {};
		
		if (publicOrderId) {
			filter.publicOrderId = publicOrderId;
		}
		
		if (status && status !== 'all') {
			const allowedStatuses = ['pending', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'];
			if (!allowedStatuses.includes(status)) {
				return res.status(400).json({ 
					success: false, 
					message: 'Invalid status value' 
				});
			}
			filter.trackingStatus = status;
		}
		
		if (phoneNumber) {
			const sanitizedPhone = phoneNumber.replace(/[^0-9+\-\s()]/g, '');
			if (sanitizedPhone) {
				const User = mongoose.model('User');
				const users = await User.find({ phoneNumber: { $regex: sanitizedPhone, $options: 'i' } }, '_id');
				const userIds = users.map(u => u._id);
				if (userIds.length > 0) {
					filter.user = { $in: userIds };
				} else {
					filter.user = null;
				}
			}
		}
		
		// Find orders with filters
		const orders = await Order.find(filter)
			.populate('user', 'name email phoneNumber')
			.populate({
				path: 'products.product',
				select: 'name price category',
			})
			.lean();

		// Generate CSV content
		const csvRows = [];
		
		// CSV Header
		csvRows.push([
			'Order ID',
			'Order Date',
			'Customer Name',
			'Customer Phone',
			'Customer Email',
			'Product Name',
			'Quantity',
			'Price',
			'Total Amount',
			'Status',
			'Tracking Number',
			'House Number',
			'Street Address',
			'Landmark',
			'City',
			'State',
			'Pincode'
		].join(','));

		// CSV Data
		orders.forEach(order => {
			const products = order.products || [];
			const address = order.address || {};
			const user = order.user || {};
			
			if (products.length === 0) {
				// Order with no products
				csvRows.push([
					`"${order.publicOrderId || order._id}"`,
					`"${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
					`"${user.name || 'N/A'}"`,
					`"${user.phoneNumber || 'N/A'}"`,
					`"${user.email || 'N/A'}"`,
					'',
					'',
					'',
					`"${order.totalAmount}"`,
					`"${order.trackingStatus}"`,
					`"${order.trackingNumber || 'N/A'}"`,
					`"${address.houseNumber || ''}"`,
					`"${address.streetAddress || ''}"`,
					`"${address.landmark || ''}"`,
					`"${address.city || ''}"`,
					`"${address.state || ''}"`,
					`"${address.pincode || ''}"`
				].join(','));
			} else {
				products.forEach((p, index) => {
					const prod = p.product;
					csvRows.push([
						`"${order.publicOrderId || order._id}"`,
						`"${new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
						`"${user.name || 'N/A'}"`,
						`"${user.phoneNumber || 'N/A'}"`,
						`"${user.email || 'N/A'}"`,
						`"${prod?.name || 'PRODUCT_REMOVED'}"`,
						`"${p.quantity}"`,
						`"${prod?.price || p.price}"`,
						index === 0 ? `"${order.totalAmount}"` : '""', // Only show total amount on first product row
						index === 0 ? `"${order.trackingStatus}"` : '""',
						index === 0 ? `"${order.trackingNumber || 'N/A'}"` : '""',
						index === 0 ? `"${address.houseNumber || ''}"` : '""',
						index === 0 ? `"${address.streetAddress || ''}"` : '""',
						index === 0 ? `"${address.landmark || ''}"` : '""',
						index === 0 ? `"${address.city || ''}"` : '""',
						index === 0 ? `"${address.state || ''}"` : '""',
						index === 0 ? `"${address.pincode || ''}"` : '""'
					].join(','));
				});
			}
		});

		const csv = csvRows.join('\n');

		// Set headers for CSV download
		res.setHeader('Content-Type', 'text/csv');
		res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
		
		res.send(csv);
	} catch (err) {
		console.error('Error exporting orders to CSV:', err);
		return res.status(500).json({ success: false, message: 'Server error exporting orders' });
	}
};