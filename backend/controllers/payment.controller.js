import crypto from "crypto";

// Helper: hash + base62 encode
function generatePublicOrderId(orderData) {
	const hash = crypto.createHash('sha256').update(JSON.stringify(orderData) + Date.now()).digest();
	const base62 = hash.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase();
	return base62;
}
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { stripe } from "../lib/stripe.js";

export const createCheckoutSession = async (req, res) => {
	try {
		const { products, couponCode, address } = req.body;

		if (!Array.isArray(products) || products.length === 0) {
			return res.status(400).json({ error: "Invalid or empty products array" });
		}

		// Validate stock availability for all products
		for (const item of products) {
			const product = await Product.findById(item._id);
			if (!product) {
				return res.status(404).json({ error: `Product ${item.name} not found` });
			}
			if (product.stockQuantity < item.quantity) {
				return res.status(400).json({ 
					error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}` 
				});
			}
		}

		let totalAmount = 0;

		const lineItems = products.map((product) => {
			const amount = Math.round(product.price * 100); // stripe wants u to send in the format of cents
			totalAmount += amount * product.quantity;

			return {
				price_data: {
					currency: "usd",
					product_data: {
						name: product.name,
						images: [product.image],
					},
					unit_amount: amount,
				},
				quantity: product.quantity || 1,
			};
		});

		let coupon = null;
		if (couponCode) {
			coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
			if (coupon) {
				totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
			}
		}

		const session = await stripe.checkout.sessions.create({
			payment_method_types: ["card"],
			line_items: lineItems,
			mode: "payment",
			success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
			discounts: coupon
				? [
						{
							coupon: await createStripeCoupon(coupon.discountPercentage),
						},
				  ]
				: [],
			metadata: {
				userId: req.user._id.toString(),
				couponCode: couponCode || "",
				address: JSON.stringify(address), // 👈 save address to metadata
				products: JSON.stringify(
					products.map((p) => ({
						id: p._id,
						quantity: p.quantity,
						price: p.price,
					}))
				),
			},
		});

		if (totalAmount >= 20000) {
			await createNewCoupon(req.user._id);
		}
		res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
	} catch (error) {
		console.error("Error processing checkout:", error);
		res.status(500).json({ message: "Error processing checkout", error: error.message });
	}
};

export const checkoutSuccess = async (req, res) => {
	try {
		const { sessionId } = req.body;
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status === "paid") {
			if (session.metadata.couponCode) {
				await Coupon.findOneAndUpdate(
					{
						code: session.metadata.couponCode,
						userId: session.metadata.userId,
					},
					{
						isActive: false,
					}
				);
			}

			// create a new Order
			const products = JSON.parse(session.metadata.products);
			const address = JSON.parse(session.metadata.address); // 👈 retrieve address
			
			// Update stock quantities and sold counts for each product using Promise.all for better performance
			await Promise.all(
				products.map((item) =>
					Product.findByIdAndUpdate(
						item.id,
						{
							$inc: {
								stockQuantity: -item.quantity,
								sold: item.quantity,
							},
						}
					)
				)
			);

			const newOrder = new Order({
				user: session.metadata.userId,
				products: products.map((product) => ({
					product: product.id,
					quantity: product.quantity,
					price: product.price,
				})),
				totalAmount: session.amount_total / 100, // convert from cents to dollars,
				stripeSessionId: sessionId,
				address,
				status: "paid",
				trackingStatus: "pending",
				publicOrderId: generatePublicOrderId({
					user: session.metadata.userId,
					products,
					totalAmount: session.amount_total / 100,
					address,
					created: Date.now()
				}),
			});

			await newOrder.save();

			res.status(200).json({
				success: true,
				message: "Payment successful, order created, and coupon deactivated if used.",
				orderId: newOrder._id,
				publicOrderId: newOrder.publicOrderId,
			});
		}
	} catch (error) {
		console.error("Error processing successful checkout:", error);
		res.status(500).json({ message: "Error processing successful checkout", error: error.message });
	}
};

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}

async function createNewCoupon(userId) {
	await Coupon.findOneAndDelete({ userId });

	const newCoupon = new Coupon({
		code: "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
		discountPercentage: 10,
		expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		userId: userId,
	});

	await newCoupon.save();

	return newCoupon;
}


// import Coupon from "../models/coupon.model.js";
// import Order from "../models/order.model.js";
// import { stripe } from "../lib/stripe.js";

// export const createCheckoutSession = async (req, res) => {
//   try {
//     const { products, couponCode, address } = req.body;

//     if (!Array.isArray(products) || products.length === 0) {
//       return res.status(400).json({ error: "Invalid or empty products array" });
//     }

//     if (!address) {
//       return res.status(400).json({ error: "Address is required" });
//     }

//     let totalAmount = 0;
//     const lineItems = products.map((product) => {
//       const amount = Math.round(product.price * 100);
//       totalAmount += amount * product.quantity;
//       return {
//         price_data: {
//           currency: "usd",
//           product_data: {
//             name: product.name,
//             images: [product.image],
//           },
//           unit_amount: amount,
//         },
//         quantity: product.quantity || 1,
//       };
//     });

//     // coupon handling (unchanged)
//     let coupon = null;
//     if (couponCode) {
//       coupon = await Coupon.findOne({ code: couponCode, userId: req.user._id, isActive: true });
//       if (coupon) {
//         totalAmount -= Math.round((totalAmount * coupon.discountPercentage) / 100);
//       }
//     }

//     const session = await stripe.checkout.sessions.create({
//       payment_method_types: ["card"],
//       line_items: lineItems,
//       mode: "payment",
//       success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
//       cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
//       discounts: coupon ? [{ coupon: await createStripeCoupon(coupon.discountPercentage) }] : [],
//       metadata: {
//         userId: req.user._id.toString(),
//         couponCode: couponCode || "",
//         products: JSON.stringify(
//           products.map((p) => ({ id: p._id, quantity: p.quantity, price: p.price }))
//         ),
//         // caution: metadata values have size limits; this is okay for small addresses
//         address: JSON.stringify(address),
//       },
//     });

//     if (totalAmount >= 20000) {
//       await createNewCoupon(req.user._id);
//     }

//     res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
//   } catch (error) {
//     console.error("Error processing checkout:", error);
//     res.status(500).json({ message: "Error processing checkout", error: error.message });
//   }
// };

// export const checkoutSuccess = async (req, res) => {
//   try {
//     const { sessionId, address: addressFromClient } = req.body;
//     const session = await stripe.checkout.sessions.retrieve(sessionId);

//     if (session.payment_status !== "paid") {
//       return res.status(400).json({ message: "Payment not completed." });
//     }

//     // deactivate coupon if used
//     if (session.metadata.couponCode) {
//       await Coupon.findOneAndUpdate(
//         { code: session.metadata.couponCode, userId: session.metadata.userId },
//         { isActive: false }
//       );
//     }

//     // get products (from metadata)
//     const products = JSON.parse(session.metadata.products || "[]");

//     // Prefer address sent in body (addressFromClient). If not present, fallback to metadata.
//     let address = null;
//     if (addressFromClient) {
//       address = addressFromClient;
//     } else if (session.metadata.address) {
//       try {
//         address = JSON.parse(session.metadata.address);
//       } catch (e) {
//         address = null;
//       }
//     }

//     if (!address) {
//       // you may choose to fail here or set a default; I prefer error to avoid orders without address
//       return res.status(400).json({ message: "Address not provided" });
//     }

//     const newOrder = new Order({
//       user: session.metadata.userId,
//       products: products.map((product) => ({
//         product: product.id,
//         quantity: product.quantity,
//         price: product.price,
//       })),
//       totalAmount: session.amount_total / 100,
//       stripeSessionId: sessionId,
//       address,
//     });

//     await newOrder.save();

//     res.status(200).json({
//       success: true,
//       message: "Payment successful and order created with address.",
//       orderId: newOrder._id,
//     });
//   } catch (error) {
//     console.error("Error processing successful checkout:", error);
//     res.status(500).json({ message: "Error processing successful checkout", error: error.message });
//   }
// };
