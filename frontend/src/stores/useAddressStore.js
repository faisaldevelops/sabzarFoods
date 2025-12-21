import toast from "react-hot-toast";
import axios from "../lib/axios";
import { create } from "zustand";

const ADDRESS_CACHE_KEY = "address_cache";
let addressFetchPromise = null;

// Helper to get cached addresses
const getCachedAddresses = () => {
	try {
		const cached = localStorage.getItem(ADDRESS_CACHE_KEY);
		return cached ? JSON.parse(cached) : [];
	} catch (error) {
		console.error("Error reading addresses from cache:", error);
		return [];
	}
};

// Helper to cache addresses
const setCachedAddresses = (addresses) => {
	try {
		if (addresses && addresses.length > 0) {
			localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(addresses));
		} else {
			localStorage.removeItem(ADDRESS_CACHE_KEY);
		}
	} catch (error) {
		console.error("Error caching addresses:", error);
	}
};

export const useAddressStore = create((set, get) => ({{
  // keep this as an array (multiple addresses)
  address: getCachedAddresses(), // Initialize with cached addresses
  loading: false,

  // Fetch all addresses for authenticated user
  fetchAddresses: async () => {
    // Prevent multiple simultaneous fetch attempts
    if (addressFetchPromise) {
      return addressFetchPromise;
    }

    addressFetchPromise = (async () => {
      set({ loading: true });
      try {
        const response = await axios.get("/address");
        set({ address: response.data, loading: false });
        setCachedAddresses(response.data);
        return response.data;
      } catch (error) {
        const message =
          error?.response?.data?.message || error.message || "Failed to fetch addresses";
        console.error("Error fetching addresses:", error);
        set({ loading: false });
        // Don't show error toast for fetch - it's expected on first load
        return [];
      } finally {
        addressFetchPromise = null;
      }
    })();

    return addressFetchPromise;
  },

  // optional: setter to replace all addresses
  setAddress: (addresses) => set({ address: addresses }),

  // createAddress now sends to backend
  createAddress: async (addressData) => {
    set({ loading: true });
    try {
      const response = await axios.post("/address", addressData);
      const created = response.data;

      // append created address to existing addresses array
      set((state) => {
        const newAddresses = Array.isArray(state.address) ? [...state.address, created] : [created];
        setCachedAddresses(newAddresses);
        return {
          address: newAddresses,
          loading: false,
        };
      });

      console.log("created:", created);
      console.log("store address:", get().address);
    
      toast.success("Address added");
      return created;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "Failed to add address";
      toast.error(message);
      console.error("Error in adding Address:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Delete an address
  deleteAddress: async (addressId) => {
    set({ loading: true });
    try {
      await axios.delete(`/address/${addressId}`);
      
      // Remove from local state
      set((state) => {
        const newAddresses = state.address.filter(addr => addr._id !== addressId);
        setCachedAddresses(newAddresses);
        return {
          address: newAddresses,
          loading: false,
        };
      });

      toast.success("Address deleted");
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "Failed to delete address";
      toast.error(message);
      console.error("Error deleting address:", error);
      set({ loading: false });
      throw error;
    }
  },

  // Update an address
  updateAddress: async (addressId, addressData) => {
    set({ loading: true });
    try {
      const response = await axios.put(`/address/${addressId}`, addressData);
      const updated = response.data;

      // Update in local state
      set((state) => {
        const newAddresses = state.address.map(addr => 
          addr._id === addressId ? updated : addr
        );
        setCachedAddresses(newAddresses);
        return {
          address: newAddresses,
          loading: false,
        };
      });

      toast.success("Address updated");
      return updated;
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "Failed to update address";
      toast.error(message);
      console.error("Error updating address:", error);
      set({ loading: false });
      throw error;
    }
  },
}));
