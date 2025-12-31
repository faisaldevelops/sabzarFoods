


import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  pincode: { type: String, required: true },
  houseNumber: { type: String, required: true },
  streetAddress: { type: String, required: true },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    publicOrderId: { type: String, unique: true, required: true },
    address: { type: addressSchema, required: true },
    razorpayOrderId: { type: String },    // new field for Razorpay
    razorpayPaymentId: { type: String },  // new field for Razorpay payment id
    status: { type: String, enum: ["pending", "hold", "paid", "cancelled", "expired"], default: "pending" },
    
    // Manual order fields
    isManualOrder: { type: Boolean, default: false },
    orderSource: { 
      type: String, 
      enum: ["website", "whatsapp", "instagram", "phone", "other"], 
      default: "website" 
    },
    paymentMethod: { 
      type: String, 
      enum: ["razorpay", "cash", "upi", "bank_transfer", "cod"], 
      default: "razorpay" 
    },
    paymentStatus: { 
      type: String, 
      enum: ["paid", "pending", "cod", "partial"], 
      default: "paid" 
    },
    deliveryFee: { type: Number, default: 0, min: 0 },
    platformFee: { type: Number, default: 0, min: 0 },
    adminNotes: { type: String, default: "" },
    
    // Label tracking
    labelPrintedAt: { type: Date, default: null },
    labelPrintBatch: { type: String, default: null }, // Batch ID for group prints
    
    expiresAt: { type: Date, default: null }, // Hold expiration time (e.g., 15 minutes from creation)
    trackingStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
      default: null,
    },
    deliveryPartner: {
      type: String,
      enum: ["india_post", "delhivery", null],
      default: null,
    },
    estimatedDelivery: {
      type: Date,
      default: null,
    },
    trackingHistory: [
      {
        status: {
          type: String,
          enum: ["pending", "processing", "ready", "shipped", "delivered", "cancelled"],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

/**
 * Indexes:
 * - Make razorpayOrderId and razorpayPaymentId unique only when present.
 * Partial indexes avoid the "multiple null" problem.
 */
orderSchema.index(
  { razorpayOrderId: 1 },
  { unique: true, partialFilterExpression: { razorpayOrderId: { $exists: true, $type: "string" } } }
);

orderSchema.index(
  { razorpayPaymentId: 1 },
  { unique: true, partialFilterExpression: { razorpayPaymentId: { $exists: true, $type: "string" } } }
);

// Pre-save middleware to add initial tracking history
orderSchema.pre("save", function (next) {
  if (this.isNew && this.trackingHistory.length === 0) {
    this.trackingHistory.push({
      status: this.trackingStatus,
      timestamp: new Date(),
      note: "Order placed",
    });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

export default Order;
