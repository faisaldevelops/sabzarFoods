import express from "express";
import { sendOTP, verifyOTP, resendOTP } from "../controllers/otp.controller.js";

const router = express.Router();

router.post("/send", sendOTP);
router.post("/verify", verifyOTP);
router.post("/resend", resendOTP);

export default router;
