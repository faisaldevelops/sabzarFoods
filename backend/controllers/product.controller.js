import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { extractCloudinaryPublicId } from "../lib/cloudinaryUtils.js";
import { uploadToS3, deleteFromS3, isS3Url } from "../lib/s3.js";

/**
 * Helper to delete a product image from either S3 or Cloudinary
 */
const deleteProductImage = async (imageUrl) => {
	if (!imageUrl) return;

	if (isS3Url(imageUrl)) {
		await deleteFromS3(imageUrl);
		return;
	}

	const publicId = extractCloudinaryPublicId(imageUrl);
	if (publicId) {
		try {
			await cloudinary.uploader.destroy(publicId);
			console.log("Deleted image from Cloudinary:", publicId);
		} catch (error) {
			console.log("Error deleting image from Cloudinary:", error.message);
		}
	}
};

export const getAllProducts = async (req, res) => {
	try {
		// By default return only visible products for store front, sorted by custom order
		// If req.query.all === "true", return all products (e.g. for admin usage)
		const query = req.query.all === "true" ? {} : { isHidden: { $ne: true } };
		const products = await Product.find(query).sort({ order: 1, createdAt: 1 });
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAdminProducts = async (req, res) => {
	try {
		const products = await Product.find({}).sort({ order: 1, createdAt: 1 });
		res.json({ products });
	} catch (error) {
		console.log("Error in getAdminProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const {
			name,
			description,
			actualPrice,
			price,
			image,
			stockQuantity,
			isHidden,
			isRestricted,
			restrictionType,
			restrictedPincodes,
			restrictedLocations,
		} = req.body;

		// Validate required fields
		if (!name || !description || !price || !image) {
			return res.status(400).json({ 
				message: "Validation error", 
				error: "Name, description, price, and image are required" 
			});
		}

		let imageUrl = "";

		if (image) {
			const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
			if (bucketName) {
				const uploadResult = await uploadToS3(image, "products");
				imageUrl = uploadResult.secure_url;
			} else {
				const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
				imageUrl = cloudinaryResponse?.secure_url || "";
			}
		}

		// Sanitize restrictions
		const validRestrictionType = ["none", "pincodes", "districts", "both"].includes(restrictionType)
			? restrictionType
			: "none";
		const effectiveIsRestricted = Boolean(isRestricted && validRestrictionType !== "none");

		const cleanedPincodes = Array.isArray(restrictedPincodes)
			? [...new Set(restrictedPincodes.map((p) => String(p).trim()).filter((p) => /^\d{6}$/.test(p)))]
			: [];

		const cleanedLocations = Array.isArray(restrictedLocations)
			? restrictedLocations
					.filter((loc) => loc && loc.state && typeof loc.state === "string")
					.map((loc) => ({
						state: loc.state.trim(),
						districts: Array.isArray(loc.districts)
							? [...new Set(loc.districts.map((d) => String(d).trim()).filter(Boolean))]
							: [],
					}))
			: [];

		// Assign next order position to place new product at end of list
		const lastProduct = await Product.findOne().sort({ order: -1 });
		const nextOrder = lastProduct && typeof lastProduct.order === "number" ? lastProduct.order + 1 : 0;

		const product = await Product.create({
			name,
			description,
			actualPrice: actualPrice || price, // Default to price if actualPrice not provided
			price,
			image: imageUrl,
			stockQuantity: stockQuantity || 0,
			isHidden: Boolean(isHidden),
			order: nextOrder,
			isRestricted: effectiveIsRestricted,
			restrictionType: effectiveIsRestricted ? validRestrictionType : "none",
			restrictedPincodes: cleanedPincodes,
			restrictedLocations: cleanedLocations,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			await deleteProductImage(product.image);
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$match: { isHidden: { $ne: true } },
			},
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
					stockQuantity: 1,
					reservedQuantity: 1,
					sold: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProductStock = async (req, res) => {
	try {
		const { stockQuantity } = req.body;
		const product = await Product.findById(req.params.id);
		
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (stockQuantity !== undefined) {
			product.stockQuantity = stockQuantity;
		}

		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProductStock controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateProduct = async (req, res) => {
	try {
		const {
			name,
			description,
			actualPrice,
			price,
			image,
			stockQuantity,
			isHidden,
			order,
			isRestricted,
			restrictionType,
			restrictedPincodes,
			restrictedLocations,
		} = req.body;
		const product = await Product.findById(req.params.id);
		
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// If there's a new image, upload it to S3 (or Cloudinary fallback)
		let newImageUrl = null;
		// Check if image is base64 (new upload) by checking if it starts with data:image
		const isNewImage = image && image.startsWith('data:image');
		
		if (isNewImage) {
			// Delete old image from S3 or Cloudinary if it exists
			if (product.image) {
				await deleteProductImage(product.image);
			}
			const bucketName = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_BUCKET_NAME;
			if (bucketName) {
				const uploadResult = await uploadToS3(image, "products");
				newImageUrl = uploadResult.secure_url;
			} else {
				const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
				newImageUrl = cloudinaryResponse?.secure_url || null;
			}
		}

		// Update product fields
		if (name !== undefined) product.name = name;
		if (description !== undefined) product.description = description;
		if (actualPrice !== undefined) product.actualPrice = actualPrice;
		if (price !== undefined) product.price = price;
		if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
		if (isHidden !== undefined) product.isHidden = Boolean(isHidden);
		if (order !== undefined) product.order = Number(order);
		if (newImageUrl) product.image = newImageUrl;

		// Update restriction fields if provided
		if (restrictionType !== undefined || isRestricted !== undefined) {
			const validRestrictionType = ["none", "pincodes", "districts", "both"].includes(restrictionType)
				? restrictionType
				: "none";
			const effectiveIsRestricted = Boolean(isRestricted && validRestrictionType !== "none");
			
			product.isRestricted = effectiveIsRestricted;
			product.restrictionType = effectiveIsRestricted ? validRestrictionType : "none";
		}

		if (restrictedPincodes !== undefined) {
			product.restrictedPincodes = Array.isArray(restrictedPincodes)
				? [...new Set(restrictedPincodes.map((p) => String(p).trim()).filter((p) => /^\d{6}$/.test(p)))]
				: [];
		}

		if (restrictedLocations !== undefined) {
			product.restrictedLocations = Array.isArray(restrictedLocations)
				? restrictedLocations
						.filter((loc) => loc && loc.state && typeof loc.state === "string")
						.map((loc) => ({
							state: loc.state.trim(),
							districts: Array.isArray(loc.districts)
								? [...new Set(loc.districts.map((d) => String(d).trim()).filter(Boolean))]
								: [],
						}))
				: [];
		}
		
		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleProductVisibility = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (req.body && req.body.isHidden !== undefined) {
			product.isHidden = Boolean(req.body.isHidden);
		} else {
			product.isHidden = !product.isHidden;
		}

		const updatedProduct = await product.save();
		res.json({
			message: `Product is now ${updatedProduct.isHidden ? "hidden from" : "visible on"} the store`,
			product: updatedProduct,
		});
	} catch (error) {
		console.log("Error in toggleProductVisibility controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const reorderProducts = async (req, res) => {
	try {
		const { orderedIds } = req.body;
		if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
			return res.status(400).json({ message: "orderedIds must be a non-empty array of product IDs" });
		}

		const bulkOps = orderedIds.map((id, index) => ({
			updateOne: {
				filter: { _id: id },
				update: { $set: { order: index } },
			},
		}));

		await Product.bulkWrite(bulkOps);

		const products = await Product.find({}).sort({ order: 1, createdAt: 1 });
		res.json({ message: "Products reordered successfully", products });
	} catch (error) {
		console.log("Error in reorderProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
