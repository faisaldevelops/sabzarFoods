import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  getFinanceDashboard,
  getProductCosting,
  exportFinanceCSV,
  getMonthlyProfitTrend,
  processMonthlyReimbursement,
  getReimbursementHistory,
} from "../controllers/finance.controller.js";

const router = express.Router();

// All routes require admin authentication
router.get("/dashboard", protectRoute, adminRoute, getFinanceDashboard);
router.post("/reimbursement", protectRoute, adminRoute, processMonthlyReimbursement);
router.get("/reimbursement/history", protectRoute, adminRoute, getReimbursementHistory);
router.get("/product/:productId", protectRoute, adminRoute, getProductCosting);
router.get("/export/csv", protectRoute, adminRoute, exportFinanceCSV);
router.get("/trends/monthly", protectRoute, adminRoute, getMonthlyProfitTrend);

export default router;
