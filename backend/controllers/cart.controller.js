import Product from "../models/product.model.js";

export const getCartProducts = async (req, res) => {
	try {
		// If no user is authenticated, return empty cart
		if (!req.user) {
			return res.json([]);
		}

		const products = await Product.find({ _id: { $in: req.user.cartItems } });

		// add quantity for each product
		const cartItems = products.map((product) => {
			const item = req.user.cartItems.find((cartItem) => cartItem.id === product.id);
			return { ...product.toJSON(), quantity: item.quantity };
		});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in getCartProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const addToCart = async (req, res) => {
	try {
		// Guest users should use localStorage on frontend, return success with empty response
		if (!req.user) {
			return res.status(200).json({ message: "Guest cart managed on client side", guestMode: true });
		}

		const { productId } = req.body;
		const user = req.user;

		const existingItem = user.cartItems.find((item) => item.id === productId);
		if (existingItem) {
			existingItem.quantity += 1;
		} else {
			user.cartItems.push(productId);
		}

		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		console.log("Error in addToCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const removeAllFromCart = async (req, res) => {
	try {
		// Guest users should use localStorage on frontend, return success with empty response
		if (!req.user) {
			return res.status(200).json({ message: "Guest cart managed on client side", guestMode: true });
		}

		const { productId } = req.body;
		const user = req.user;
		if (!productId) {
			user.cartItems = [];
		} else {
			user.cartItems = user.cartItems.filter((item) => item.id !== productId);
		}
		await user.save();
		res.json(user.cartItems);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateQuantity = async (req, res) => {
	try {
		// Guest users should use localStorage on frontend, return success with empty response
		if (!req.user) {
			return res.status(200).json({ message: "Guest cart managed on client side", guestMode: true });
		}

		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const syncCart = async (req, res) => {
	try {
		// Only authenticated users can sync cart
		if (!req.user) {
			return res.status(401).json({ message: "Authentication required" });
		}

		const { guestCart } = req.body;

		if (!Array.isArray(guestCart)) {
			return res.status(400).json({ message: "Invalid cart data" });
		}

		const user = req.user;

		// Merge guest cart with user's existing cart
		for (const guestItem of guestCart) {
			const { _id: productId, quantity } = guestItem;

			if (!productId || !quantity) {
				continue; // Skip invalid items
			}

			// Check if product exists in user's cart
			const existingItem = user.cartItems.find((item) => item.id === productId);

			if (existingItem) {
				// Add quantities if product already exists
				existingItem.quantity += quantity;
			} else {
				// Add new item to cart
				user.cartItems.push({ product: productId, quantity });
			}
		}

		await user.save();

		// Return the merged cart with product details
		const products = await Product.find({ _id: { $in: user.cartItems.map(item => item.product) } });
		const cartItems = products.map((product) => {
			const item = user.cartItems.find((cartItem) => cartItem.product.toString() === product._id.toString());
			return { ...product.toJSON(), quantity: item.quantity };
		});

		res.json(cartItems);
	} catch (error) {
		console.log("Error in syncCart controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
