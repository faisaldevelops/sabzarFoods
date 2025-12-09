// import mongoose from "mongoose";

// const orderSchema = new mongoose.Schema(
// 	{
// 		user: {
// 			type: mongoose.Schema.Types.ObjectId,
// 			ref: "User",
// 			required: true,
// 		},
// 		products: [
// 			{
// 				product: {
// 					type: mongoose.Schema.Types.ObjectId,
// 					ref: "Product",
// 					required: true,
// 				},
// 				quantity: {
// 					type: Number,
// 					required: true,
// 					min: 1,
// 				},
// 				price: {
// 					type: Number,
// 					required: true,
// 					min: 0,
// 				},
// 			},
// 		],
// 		totalAmount: {
// 			type: Number,
// 			required: true,
// 			min: 0,
// 		},
// 		stripeSessionId: {
// 			type: String,
// 			unique: true,
// 		},
// 	},
// 	{ timestamps: true }
// );

// const Order = mongoose.model("Order", orderSchema);

// export default Order;


// import mongoose from "mongoose";

// const addressSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   phoneNumber: { type: String, required: true },
//   pincode: { type: String, required: true },
//   houseNumber: { type: String, required: true },
//   streetAddress: { type: String, required: true },
//   landmark: { type: String },
//   city: { type: String, required: true },
//   state: { type: String, required: true },
// });

// const orderSchema = new mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//     },
//     products: [
//       {
//         product: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Product",
//           required: true,
//         },
//         quantity: { type: Number, required: true, min: 1 },
//         price: { type: Number, required: true, min: 0 },
//       },
//     ],
//     totalAmount: { type: Number, required: true, min: 0 },
//     address: { type: addressSchema, required: true }, // 👈👈👈<-- added
//     stripeSessionId: { type: String, unique: true },
//   },
//   { timestamps: true }
// );

// const Order = mongoose.model("Order", orderSchema);

// export default Order;


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
    stripeSessionId: { type: String }, // keep field but do not make plain unique here
    razorpayOrderId: { type: String },    // new field for Razorpay
    razorpayPaymentId: { type: String },  // new field for Razorpay payment id
    status: { type: String, enum: ["pending", "hold", "paid", "cancelled", "expired"], default: "pending" },
    expiresAt: { type: Date, default: null }, // Hold expiration time (e.g., 15 minutes from creation)
    couponCode: { type: String, default: null },
    trackingStatus: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingNumber: {
      type: String,
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
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
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
 * - Make stripeSessionId unique only when present (partial index).
 * - Make razorpayOrderId and razorpayPaymentId unique only when present.
 * Partial indexes avoid the "multiple null" problem.
 */
orderSchema.index(
  { stripeSessionId: 1 },
  { unique: true, partialFilterExpression: { stripeSessionId: { $exists: true, $type: "string" } } }
);

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
