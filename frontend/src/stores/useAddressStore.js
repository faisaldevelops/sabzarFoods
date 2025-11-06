import toast from "react-hot-toast";
import axios from "../lib/axios";
import { create } from "zustand";

export const useAddressStore = create((set, get) => ({
  // keep this as an array (multiple addresses)
  address: [],
  loading: false,

  // optional: setter to replace all addresses
  setAddress: (addresses) => set({ address: addresses }),

  // createAddress now accepts the address object directly
  createAddress: async (addressData) => {
    set({ loading: true });
    try {
      // send the addressData to backend
      //   const response = await axios.post("/address", addressData);

      // assume backend returns the created address or full list.
      // If it returns single created address:
      //   const created = response.data;
      const created= addressData;

      // append created address to existing addresses array
      set((state) => ({
        address: Array.isArray(state.address) ? [...state.address, created] : [created],
        loading: false,
      }));

      // log the store state correctly
      console.log("created:", created);
      console.log("store address:", get().address);
    
    
      toast.success("Address added");
      return created;
    } catch (error) {
      // defensive: error.response may be undefined
      const message =
        (error && error.response && error.response.data && error.response.data.error) ||
        error.message ||
        "Failed to add address";
      toast.error(message);
      console.error("Error in adding Address: ", error);
      set({ loading: false });
      throw error; // rethrow if caller needs to handle it
    }
  },

  // optionally a delete/update action could go here
}));
