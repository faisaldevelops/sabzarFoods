import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
			toast.success("Product created successfully");
		} catch (error) {
			toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to create product");
			set({ loading: false });
		}
	},
	fetchAllProducts: async (isAdmin = false) => {
		set({ loading: true });
		try {
			const endpoint = isAdmin ? "/products/admin" : "/products";
			const response = await axios.get(endpoint);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch products");
		}
	},
	fetchAdminProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/admin");
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to fetch products");
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId),
				loading: false,
			}));
			toast.success("Product deleted successfully");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to delete product");
		}
	},
	updateProduct: async (productId, productData) => {
		set({ loading: true });
		try {
			const response = await axios.put(`/products/${productId}`, productData);
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? response.data : product
				),
				loading: false,
			}));
			toast.success("Product updated successfully");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || error.response?.data?.message || "Failed to update product");
		}
	},
	toggleProductVisibility: async (productId) => {
		const prevProducts = get().products;
		const targetProduct = prevProducts.find((p) => p._id === productId);
		if (!targetProduct) return;

		const nextHiddenState = !targetProduct.isHidden;

		// Optimistic update
		set({
			products: prevProducts.map((p) =>
				p._id === productId ? { ...p, isHidden: nextHiddenState } : p
			),
		});

		try {
			const response = await axios.patch(`/products/${productId}/visibility`, {
				isHidden: nextHiddenState,
			});
			const updatedProduct = response.data.product || response.data;
			set({
				products: get().products.map((p) =>
					p._id === productId ? { ...p, ...updatedProduct } : p
				),
			});
			toast.success(
				nextHiddenState
					? "Product is now hidden from homepage"
					: "Product is now visible on homepage"
			);
		} catch (error) {
			// Rollback on failure
			set({ products: prevProducts });
			toast.error(
				error.response?.data?.error ||
					error.response?.data?.message ||
					"Failed to update product visibility"
			);
		}
	},
	moveProduct: async (productId, direction) => {
		const prevProducts = [...get().products];
		const currentIndex = prevProducts.findIndex((p) => p._id === productId);

		if (currentIndex === -1) return;
		if (direction === "up" && currentIndex === 0) return;
		if (direction === "down" && currentIndex === prevProducts.length - 1) return;

		const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

		// Swap items
		const updatedProducts = [...prevProducts];
		const temp = updatedProducts[currentIndex];
		updatedProducts[currentIndex] = updatedProducts[targetIndex];
		updatedProducts[targetIndex] = temp;

		// Optimistic update with recalculated order indices
		const normalizedProducts = updatedProducts.map((p, idx) => ({
			...p,
			order: idx,
		}));

		set({ products: normalizedProducts });

		try {
			const orderedIds = normalizedProducts.map((p) => p._id);
			await axios.patch("/products/reorder", { orderedIds });
			toast.success(`Moved product ${direction}`);
		} catch (error) {
			// Rollback on failure
			set({ products: prevProducts });
			toast.error(
				error.response?.data?.error ||
					error.response?.data?.message ||
					"Failed to reorder products"
			);
		}
	},
	reorderProducts: async (newOrderedProducts) => {
		const prevProducts = get().products;
		const normalizedProducts = newOrderedProducts.map((p, idx) => ({
			...p,
			order: idx,
		}));

		set({ products: normalizedProducts });

		try {
			const orderedIds = normalizedProducts.map((p) => p._id);
			await axios.patch("/products/reorder", { orderedIds });
			toast.success("Products reordered successfully");
		} catch (error) {
			set({ products: prevProducts });
			toast.error(
				error.response?.data?.error ||
					error.response?.data?.message ||
					"Failed to reorder products"
			);
		}
	},
}));
