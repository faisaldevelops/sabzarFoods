import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		actualPrice: {
			type: Number,
			min: 0,
			required: true,
		},
		price: {
			type: Number,
			min: 0,
			required: true,
		},
		image: {
			type: String,
			required: [true, "Image is required"],
		},
		category: {
			type: String,
			required: false,
		},
		stockQuantity: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		sold: {
			type: Number,
			default: 0,
			min: 0,
		},
		reservedQuantity: {
			type: Number,
			default: 0,
			min: 0,
		},
		isRestricted: {
			type: Boolean,
			default: false,
		},
		restrictionType: {
			type: String,
			enum: ["none", "pincodes", "districts", "both"],
			default: "none",
		},
		restrictedPincodes: {
			type: [String],
			default: [],
		},
		restrictedLocations: [
			{
				state: {
					type: String,
					required: true,
				},
				districts: {
					type: [String],
					default: [],
				},
			},
		],
	},
	{ timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
