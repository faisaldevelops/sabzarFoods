import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import orderRoutes from "./routes/order.route.js";
import analyticsRoutes from "./routes/analytics.route.js";
import otpRoutes from "./routes/otp.route.js";
import addressRoutes from "./routes/address.route.js";
import expenseRoutes from "./routes/expense.route.js";
import bomRoutes from "./routes/bom.route.js";
import financeRoutes from "./routes/finance.route.js";
import { connectDB } from "./lib/db.js";
import { startHoldExpiryJob, stopHoldExpiryJob } from "./lib/stockHold.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;
const __dirname = path.resolve();

/* =======================
   CORS (MUST BE FIRST)
======================= */
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Allow preflight requests
app.options("*", cors());

/* =======================
   Razorpay Webhook
   (RAW BODY ONLY HERE)
======================= */
app.post(
  "/api/payments/razorpay-webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    req.rawBody = req.body;
    next();
  }
);

/* =======================
   Global Middlewares
======================= */
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

/* =======================
   Routes
======================= */
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/bom", bomRoutes);
app.use("/api/finance", financeRoutes);

/* =======================
   Start Server
======================= */
const server = app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await connectDB();
  startHoldExpiryJob();
});

/* =======================
   Graceful Shutdown
======================= */
const shutdown = () => {
  console.log("Shutting down gracefully...");
  stopHoldExpiryJob();
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
