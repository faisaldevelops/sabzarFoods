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
    address: { type: addressSchema, required: true }, // 👈👈👈<-- added
    stripeSessionId: { type: String, unique: true },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
