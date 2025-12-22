import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const PRODUCTS_CACHE_KEY = "products_cache";
const CACHE_EXPIRATION_KEY = "products_cache_expiration";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let productsFetchPromise = null;

// Helper to get cached products
const getCachedProducts = () => {
	try {
		const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
		const expiration = localStorage.getItem(CACHE_EXPIRATION_KEY);
		
		if (cached && expiration) {
			const now = Date.now();
			if (now < parseInt(expiration, 10)) {
				return JSON.parse(cached);
			} else {
				// Cache expired, clear it
				localStorage.removeItem(PRODUCTS_CACHE_KEY);
				localStorage.removeItem(CACHE_EXPIRATION_KEY);
			}
		}
		return [];
	} catch (error) {
		console.error("Error reading products from cache:", error);
		return [];
	}
};

// Helper to cache products
const setCachedProducts = (products) => {
	try {
		if (products && products.length > 0) {
			localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
			localStorage.setItem(CACHE_EXPIRATION_KEY, (Date.now() + CACHE_DURATION).toString());
		}
	} catch (error) {
		console.error("Error caching products:", error);
	}
};

export const useProductStore = create((set, get) => ({
	products: getCachedProducts(), // Initialize with cached products
	loading: false,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			const newProducts = [...get().products, res.data];
			set({ products: newProducts, loading: false });
			setCachedProducts(newProducts);
		} catch (error) {
			toast.error(error.response.data.error);
			set({ loading: false });
		}
	},
	fetchAllProducts: async () => {
		// Prevent multiple simultaneous fetch attempts
		if (productsFetchPromise) {
			return productsFetchPromise;
		}

		// Check if we have valid cached data
		const cachedProducts = getCachedProducts();
		if (cachedProducts.length > 0) {
			set({ products: cachedProducts, loading: false });
			return cachedProducts;
		}

		set({ loading: true });
		productsFetchPromise = (async () => {
			try {
				const response = await axios.get("/products");
				const products = response.data.products;
				set({ products, loading: false });
				setCachedProducts(products);
				return products;
			} catch (error) {
				set({ error: "Failed to fetch products", loading: false });
				toast.error(error.response.data.error || "Failed to fetch products");
				return [];
			} finally {
				productsFetchPromise = null;
			}
		})();

		return productsFetchPromise;
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			const newProducts = get().products.filter((product) => product._id !== productId);
			set({ products: newProducts, loading: false });
			setCachedProducts(newProducts);
			toast.success("Product deleted successfully");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to delete product");
		}
	},
	updateProduct: async (productId, productData) => {
		set({ loading: true });
		try {
			const response = await axios.put(`/products/${productId}`, productData);
			const newProducts = get().products.map((product) =>
				product._id === productId ? response.data : product
			);
			set({ products: newProducts, loading: false });
			setCachedProducts(newProducts);
			toast.success("Product updated successfully");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to update product");
		}
	},
}));
