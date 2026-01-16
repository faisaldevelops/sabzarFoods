import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getRecommendedProducts,
	updateProduct,
	updateProductStock,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllProducts);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.put("/:id", protectRoute, adminRoute, updateProduct);
router.patch("/:id/stock", protectRoute, adminRoute, updateProductStock);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;
