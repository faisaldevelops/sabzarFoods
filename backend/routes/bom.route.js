import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  upsertBOM,
  getBOMByProduct,
  getAllBOM,
  deleteBOM,
  deleteBOMByProduct,
} from "../controllers/bom.controller.js";

const router = express.Router();

// All routes require admin authentication
router.post("/", protectRoute, adminRoute, upsertBOM);
router.get("/", protectRoute, adminRoute, getAllBOM);
router.get("/product/:productId", protectRoute, adminRoute, getBOMByProduct);
router.delete("/:id", protectRoute, adminRoute, deleteBOM);
router.delete("/product/:productId", protectRoute, adminRoute, deleteBOMByProduct);

export default router;
