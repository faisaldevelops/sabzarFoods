import express from "express";
import { submitFeedback } from "../controllers/feedback.controller.js";

const router = express.Router();

// Submit feedback (no auth required - anonymous)
router.post("/submit", submitFeedback);

export default router;
