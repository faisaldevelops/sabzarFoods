import ProductBOM from "../models/productBOM.model.js";
import Product from "../models/product.model.js";

// Create or update BOM entry
export const upsertBOM = async (req, res) => {
  try {
    const { product, component, quantityPerUnit, description } = req.body;

    // Validate product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate quantityPerUnit is provided and is a positive number
    if (quantityPerUnit === undefined || quantityPerUnit === null || typeof quantityPerUnit !== 'number' || quantityPerUnit <= 0) {
      return res.status(400).json({ message: "quantityPerUnit must be a positive number" });
    }

    // Normalize component name to lowercase for consistent matching
    const normalizedComponent = component.toLowerCase().trim();

    // Check if BOM entry already exists (case-insensitive)
    const existingBOM = await ProductBOM.findOne({ product, component: normalizedComponent });

    if (existingBOM) {
      // Update existing
      existingBOM.quantityPerUnit = quantityPerUnit;
      if (description !== undefined) {
        existingBOM.description = description;
      }
      await existingBOM.save();

      return res.json({
        message: "BOM entry updated successfully",
        bom: existingBOM,
      });
    } else {
      // Create new
      const bom = new ProductBOM({
        product,
        component: normalizedComponent,
        quantityPerUnit,
        description: description || "",
      });

      await bom.save();

      return res.status(201).json({
        message: "BOM entry created successfully",
        bom,
      });
    }
  } catch (error) {
    console.error("Error upserting BOM:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get BOM entries for a product
export const getBOMByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const bomEntries = await ProductBOM.find({ product: productId })
      .populate("product", "name")
      .sort({ component: 1 });

    res.json({ bomEntries });
  } catch (error) {
    console.error("Error fetching BOM:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all BOM entries
export const getAllBOM = async (req, res) => {
  try {
    const bomEntries = await ProductBOM.find()
      .populate("product", "name")
      .sort({ product: 1, component: 1 });

    res.json({ bomEntries });
  } catch (error) {
    console.error("Error fetching BOM entries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a BOM entry
export const deleteBOM = async (req, res) => {
  try {
    const { id } = req.params;

    const bom = await ProductBOM.findByIdAndDelete(id);

    if (!bom) {
      return res.status(404).json({ message: "BOM entry not found" });
    }

    res.json({ message: "BOM entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting BOM:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete all BOM entries for a product
export const deleteBOMByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await ProductBOM.deleteMany({ product: productId });

    res.json({
      message: `Deleted ${result.deletedCount} BOM entries for product`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting BOM entries:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
