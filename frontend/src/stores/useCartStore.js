import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const CART_STORAGE_KEY = "guest_cart";

// Helper functions for localStorage
const getLocalCart = () => {
	try {
		const cart = localStorage.getItem(CART_STORAGE_KEY);
		return cart ? JSON.parse(cart) : [];
	} catch (error) {
		console.error("Error reading cart from localStorage:", error);
		return [];
	}
};

const setLocalCart = (cart) => {
	try {
		localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
	} catch (error) {
		console.error("Error saving cart to localStorage:", error);
	}
};

const clearLocalCart = () => {
	try {
		localStorage.removeItem(CART_STORAGE_KEY);
	} catch (error) {
		console.error("Error clearing cart from localStorage:", error);
	}
};

export const useCartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		try {
			const res = await axios.get("/cart");
			// If response is successful, use server cart
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			// If not authenticated or error, load from localStorage
			const localCart = getLocalCart();
			set({ cart: localCart });
			get().calculateTotals();
		}
	},
	
	clearCart: async () => {
		try {
			await axios.delete(`/cart`);
		} catch (error) {
			// Ignore error if not authenticated
		}
		clearLocalCart();
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	
	addToCart: async (product) => {
		try {
			// Try to add to server cart first
			await axios.post("/cart", { productId: product._id });
			toast.success("Product added to cart");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
							item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
					  )
					: [...prevState.cart, { ...product, quantity: 1 }];
				return { cart: newCart };
			});
			get().calculateTotals();
		} catch (error) {
			// If not authenticated, store in localStorage
			if (error.response?.status === 401) {
				set((prevState) => {
					const existingItem = prevState.cart.find((item) => item._id === product._id);
					const newCart = existingItem
						? prevState.cart.map((item) =>
								item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
						  )
						: [...prevState.cart, { ...product, quantity: 1 }];
					setLocalCart(newCart);
					return { cart: newCart };
				});
				get().calculateTotals();
				toast.success("Product added to cart");
			} else {
				toast.error(error.response?.data?.message || "An error occurred");
			}
		}
	},
	
	removeFromCart: async (productId) => {
		try {
			await axios.delete(`/cart`, { data: { productId } });
		} catch (error) {
			// Ignore error if not authenticated
		}
		
		set((prevState) => {
			const newCart = prevState.cart.filter((item) => item._id !== productId);
			setLocalCart(newCart);
			return { cart: newCart };
		});
		get().calculateTotals();
	},
	
	updateQuantity: async (productId, quantity) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		try {
			await axios.put(`/cart/${productId}`, { quantity });
		} catch (error) {
			// Ignore error if not authenticated
		}
		
		set((prevState) => {
			const newCart = prevState.cart.map((item) => 
				(item._id === productId ? { ...item, quantity } : item)
			);
			setLocalCart(newCart);
			return { cart: newCart };
		});
		get().calculateTotals();
	},
	
	calculateTotals: () => {
		const { cart, coupon } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
	
	// Initialize cart on app load
	initCart: () => {
		const localCart = getLocalCart();
		if (localCart.length > 0) {
			set({ cart: localCart });
			get().calculateTotals();
		}
	},
}));
