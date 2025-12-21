import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const USER_CACHE_KEY = "user_cache";
let authCheckPromise = null;

// Helper to load user from cache
const getCachedUser = () => {
	try {
		const cached = localStorage.getItem(USER_CACHE_KEY);
		return cached ? JSON.parse(cached) : null;
	} catch (error) {
		console.error("Error reading user from cache:", error);
		return null;
	}
};

// Helper to cache user
const setCachedUser = (user) => {
	try {
		if (user) {
			localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
		} else {
			localStorage.removeItem(USER_CACHE_KEY);
		}
	} catch (error) {
		console.error("Error caching user:", error);
	}
};

export const useUserStore = create((set, get) => ({
	user: getCachedUser(), // Initialize with cached user
	loading: false,
	checkingAuth: false, // Don't block render by default

	signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axios.post("/auth/signup", { name, email, password });
			setCachedUser(res.data);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });

			setCachedUser(res.data);
			set({ user: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			setCachedUser(null);
			set({ user: null });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		// Prevent multiple simultaneous auth checks
		if (authCheckPromise) {
			return authCheckPromise;
		}

		// Skip API call if user is already cached
		const cachedUser = getCachedUser();
		if (cachedUser) {
			set({ user: cachedUser, checkingAuth: false });
			return cachedUser;
		}

		// Only set checkingAuth if not already set (first time)
		set({ checkingAuth: true });

		authCheckPromise = (async () => {
			try {
				const response = await axios.get("/auth/profile");
				setCachedUser(response.data);
				set({ user: response.data, checkingAuth: false });
				return response.data;
			} catch (error) {
				console.log(error.message);
				setCachedUser(null);
				set({ checkingAuth: false, user: null });
				return null;
			} finally {
				authCheckPromise = null;
			}
		})();

		return authCheckPromise;
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
