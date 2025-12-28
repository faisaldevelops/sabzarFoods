import express from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from "../controllers/expense.controller.js";

const router = express.Router();

// All routes require admin authentication
router.post("/", protectRoute, adminRoute, createExpense);
router.get("/", protectRoute, adminRoute, getExpenses);
router.get("/summary", protectRoute, adminRoute, getExpenseSummary);
router.get("/:id", protectRoute, adminRoute, getExpenseById);
router.put("/:id", protectRoute, adminRoute, updateExpense);
router.delete("/:id", protectRoute, adminRoute, deleteExpense);

export default router;
