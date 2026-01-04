import express from "express";
import { 
	login, 
	logout, 
	signup, 
	refreshToken, 
	getProfile, 
	createGuestUser,
	getWhatsAppPreferences,
	updateWhatsAppPreferences,
	optInAtCheckout
} from "../controllers/auth.controller.js";
import { protectRoute, optionalAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh-token", refreshToken);
router.post("/guest", createGuestUser);
router.get("/profile", protectRoute, getProfile);

// WhatsApp opt-in preferences (compliance)
router.get("/whatsapp-preferences", protectRoute, getWhatsAppPreferences);
router.put("/whatsapp-preferences", protectRoute, updateWhatsAppPreferences);
router.post("/whatsapp-optin-checkout", optionalAuth, optInAtCheckout);

export default router;
