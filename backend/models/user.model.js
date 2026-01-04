import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		email: {
			type: String,
			unique: true,
			sparse: true,
			lowercase: true,
			trim: true,
		},
		googleId: {
			type: String,
			unique: true,
			sparse: true,
		},
		picture: {
			type: String,
		},
		cartItems: [
			{
				quantity: {
					type: Number,
					default: 1,
				},
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
				},
			},
		],
		addresses: {
			type: [
				{
					name: { type: String, required: true },
					phoneNumber: { type: String, required: true },
					email: { type: String },
					pincode: { type: String, required: true },
					houseNumber: { type: String, required: true },
					streetAddress: { type: String, required: true },
					landmark: { type: String },
					city: { type: String, required: true },
					state: { type: String, required: true },
					createdAt: { type: Date, default: Date.now },
				},
			],
			default: [],
			validate: [
				{
					validator: function (addresses) {
						return addresses.length <= 5;
					},
					message: "Maximum 5 addresses allowed per user",
				},
			],
		},
		role: {
			type: String,
			enum: ["customer", "admin"],
			default: "customer",
		},	
	},
	{
		timestamps: true,
	}
);

const User = mongoose.model("User", userSchema);

export default User;
