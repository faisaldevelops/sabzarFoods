import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Name is required"],
		},
		email: {
			type: String,
			sparse: true,
			lowercase: true,
			trim: true,
		},
		phoneNumber: {
			type: String,
			unique: true,
			sparse: true,
			trim: true,
		},
		password: {
			type: String,
			select: false, // Don't return password in queries by default
		},
		isGuest: {
			type: Boolean,
			default: false,
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

// Pre-save hook to hash password before saving to database (only if password is modified)
// Note: Password is optional for OTP-only users. Only users created via legacy email/password
// signup or guest checkout will have passwords. This hook safely handles both cases.
userSchema.pre("save", async function (next) {
	if (!this.password || !this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(10);
		this.password = await bcrypt.hash(this.password, salt);
		next();
	} catch (error) {
		next(error);
	}
});

userSchema.methods.comparePassword = async function (password) {
	if (!this.password) return false;
	return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
