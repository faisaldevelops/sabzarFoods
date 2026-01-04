// Configuration constants for the application

export const SHOP_CONFIG = {
  name: "Sabzar Foods",
  extraCharges: 20, // Extra charges in rupees (delivery/handling fee)
};

export const PAYMENT_CONFIG = {
  theme: {
    color: "#44403c", // stone-700
  },
};

// Google OAuth Client ID (replace with your actual client ID from Google Cloud Console)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
