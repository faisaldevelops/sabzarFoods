import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const CART_STORAGE_KEY = "guest_cart";

// Helper functions for localStorage
const getLocalCart = () => {
	try {
		const cart = localStorage.getItem(CART_STORAGE_KEY);
		if (!cart) return [];
		
		const parsed = JSON.parse(cart);
		// Validate that parsed data is an array
		if (!Array.isArray(parsed)) return [];
		
		// Validate each item has required properties
		const validated = parsed.filter(item => 
			item && 
			typeof item === 'object' && 
			item._id && 
			typeof item.price === 'number' &&
			typeof item.quantity === 'number'
		);
		
		return validated;
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
	total: 0,
	subtotal: 0,

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
			const response = await axios.post("/cart", { productId: product._id });
			
			// Check if this is guest mode (server returned guestMode flag)
			if (response.data?.guestMode) {
				// Handle as guest user - store in localStorage
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
				// Authenticated user - server handled it
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
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
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
		const { cart } = get();
		const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		const total = subtotal;

		set({ subtotal, total });
	},
	
	// Sync guest cart to database after login
	syncGuestCart: async () => {
		try {
			const guestCart = getLocalCart();
			
			// If no guest cart items, just fetch server cart
			if (guestCart.length === 0) {
				await get().getCartItems();
				return;
			}

			// Send guest cart to backend for merging
			const response = await axios.post("/cart/sync", { guestCart });
			
			// Clear local cart after successful sync
			clearLocalCart();
			
			// Update state with merged cart from server
			set({ cart: response.data });
			get().calculateTotals();
		} catch (error) {
			console.error("Error syncing cart:", error);
			// If sync fails, just fetch server cart
			await get().getCartItems();
		}
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
