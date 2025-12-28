import mongoose from "mongoose";

const productBOMSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    component: {
      type: String,
      required: true,
      trim: true,
    },
    quantityPerUnit: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Ensure unique component per product
productBOMSchema.index({ product: 1, component: 1 }, { unique: true });

const ProductBOM = mongoose.model("ProductBOM", productBOMSchema);

export default ProductBOM;
