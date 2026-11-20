import express from "express";
import {
	createProduct,
	deleteProduct,
	getAdminProducts,
	getAllProducts,
	getRecommendedProducts,
	reorderProducts,
	toggleProductVisibility,
	updateProduct,
	updateProductStock,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/admin", protectRoute, adminRoute, getAdminProducts);
router.get("/recommendations", getRecommendedProducts);
router.patch("/reorder", protectRoute, adminRoute, reorderProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.patch("/:id/visibility", protectRoute, adminRoute, toggleProductVisibility);
router.patch("/:id/stock", protectRoute, adminRoute, updateProductStock);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
