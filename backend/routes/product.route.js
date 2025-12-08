import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getRecommendedProducts,
	updateProduct,
	updateProductStock,
} from "../controllers/product.controller.js";
import {
	addToWaitlist,
	getWaitlist,
	removeFromWaitlist,
} from "../controllers/waitlist.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.patch("/:id/stock", protectRoute, adminRoute, updateProductStock);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

// Waitlist routes
router.post("/:id/waitlist", addToWaitlist);
router.get("/:id/waitlist", protectRoute, adminRoute, getWaitlist);
router.delete("/:id/waitlist", removeFromWaitlist);

export default router;
