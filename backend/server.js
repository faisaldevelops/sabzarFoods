// import dotenv from "dotenv";
// import express from "express";

// import cookieParser from "cookie-parser";
// import path from "path";

// import authRoutes from "./routes/auth.route.js";
// import productRoutes from "./routes/product.route.js";
// import cartRoutes from "./routes/cart.route.js";
// import couponRoutes from "./routes/coupon.route.js";
// import paymentRoutes from "./routes/payment.route.js";
// import orderRoutes from "./routes/order.route.js"
// import analyticsRoutes from "./routes/analytics.route.js";
// // import addressRoutes from "./routes/address.route.js"

// import { connectDB } from "./lib/db.js";

// dotenv.config({ path: "./.env", debug: true }); // debug=true prints helpful info

// console.log(process.env.PORT);


// const app = express();
// const PORT = process.env.PORT || 5000;

// const __dirname = path.resolve();

// app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
// app.use(cookieParser());

// app.use("/api/auth", authRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/cart", cartRoutes);
// app.use("/api/coupons", couponRoutes);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/orders", orderRoutes);
// app.use("/api/analytics", analyticsRoutes);
// // app.use("/api/address", addressRoutes);

// if (process.env.NODE_ENV === "production") {
// 	app.use(express.static(path.join(__dirname, "/frontend/dist")));

// 	app.get("*", (req, res) => {
// 		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
// 	});
// }

// app.listen(PORT, () => {
// 	console.log("Server is running on http://localhost:" + PORT);
// 	connectDB();
// });

// server.js (modified parts)
import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
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
import { connectDB } from "./lib/db.js";
import { startHoldExpiryJob } from "./lib/stockHold.js";

dotenv.config({ path: "./.env", debug: true });

const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();

// RAW parser for webhook route ONLY (before express.json)
app.post(
  "/api/payments/razorpay-webhook",
  express.raw({ type: "application/json" }), // raw body accessible in req.body as a Buffer
  (req, res, next) => {
    // save raw body on request for controller to use as string
    req.rawBody = req.body;
    // call the controller; import inside route file will handle logic
    // We'll delegate actual handling to router below, but express.raw middleware must run first.
    next();
  }
);

// now use JSON parser for all other routes
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/otp", otpRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes); // contains create/order/verify (and webhook route also exists at same path)
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
  // Start the hold expiry cleanup job after DB connection
  startHoldExpiryJob();
});
