import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

export const getOrdersData = async (req, res) => {
	try {
		// Extract filter parameters from query
		const { phoneNumber, orderId, status } = req.query;
		
		// Build filter object
		let filter = {};
		
		// Filter by orderId (validate it's a valid ObjectId first)
		if (orderId) {
			if (!mongoose.Types.ObjectId.isValid(orderId)) {
				return res.status(400).json({ 
					success: false, 
					message: 'Invalid order ID format' 
				});
			}
			filter._id = orderId;
		}
		
		// Filter by status (trackingStatus)
		if (status && status !== 'all') {
			filter.trackingStatus = status;
		}
		
		// Filter by phone number in address (database-level filtering)
		if (phoneNumber) {
			filter['address.phoneNumber'] = { $regex: phoneNumber, $options: 'i' };
		}
		
		// Find all orders with filters and populate the user and product references.
		const orders = await Order.find(filter)
			.populate('user', 'name email phoneNumber')
			.populate({
				path: 'products.product',
				select: 'name price image',
			})
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

		return res.json({ success: true, data: formatted });
	} catch (err) {
		console.error('Error fetching orders:', err);
		return res.status(500).json({ success: false, message: 'Server error fetching orders' });
	}
};

export const getUserOrders = async (req, res) => {
	try {
		const orders = await Order.find({ user: req.user._id })
			.populate({
				path: 'products.product',
				select: 'name price image',
			})
			.sort({ createdAt: -1 })
			.lean();

		const formatted = orders.map(order => ({
			orderId: order._id,
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

		res.json({ success: true, data: formatted });
	} catch (error) {
		console.error('Error fetching user orders:', error);
		res.status(500).json({ success: false, message: 'Server error fetching user orders' });
	}
};

export const updateOrderTracking = async (req, res) => {
	try {
		const { orderId } = req.params;
		const { trackingStatus, trackingNumber, estimatedDelivery, note } = req.body;

		const order = await Order.findById(orderId);
		if (!order) {
			return res.status(404).json({ message: "Order not found" });
		}

		// Update tracking fields if provided
		if (trackingStatus && trackingStatus !== order.trackingStatus) {
			order.trackingStatus = trackingStatus;
			order.trackingHistory.push({
				status: trackingStatus,
				timestamp: new Date(),
				note: note || `Status updated to ${trackingStatus}`,
			});
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