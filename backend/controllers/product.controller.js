import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { extractCloudinaryPublicId } from "../lib/cloudinaryUtils.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}); // find all products
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
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

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
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

		const product = await Product.create({
			name,
			description,
			actualPrice: actualPrice || price, // Default to price if actualPrice not provided
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			stockQuantity: stockQuantity || 0,
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
			const publicId = extractCloudinaryPublicId(product.image);
			if (publicId) {
				try {
					await cloudinary.uploader.destroy(publicId);
					console.log("deleted image from cloudinary");
				} catch (error) {
					console.log("error deleting image from cloudinary", error);
				}
			}
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
			isRestricted,
			restrictionType,
			restrictedPincodes,
			restrictedLocations,
		} = req.body;
		const product = await Product.findById(req.params.id);
		
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// If there's a new image, upload it to Cloudinary
		let cloudinaryResponse = null;
		// Check if image is base64 (new upload) by checking if it starts with data:image
		const isNewImage = image && image.startsWith('data:image');
		
		if (isNewImage) {
			// Delete old image from Cloudinary if it exists
			if (product.image) {
				const publicId = extractCloudinaryPublicId(product.image);
				if (publicId) {
					try {
						await cloudinary.uploader.destroy(publicId);
					} catch (error) {
						console.log("error deleting old image from cloudinary", error);
						// Continue with upload even if delete fails
					}
				}
			}
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		// Update product fields
		if (name !== undefined) product.name = name;
		if (description !== undefined) product.description = description;
		if (actualPrice !== undefined) product.actualPrice = actualPrice;
		if (price !== undefined) product.price = price;
		if (stockQuantity !== undefined) product.stockQuantity = stockQuantity;
		if (cloudinaryResponse?.secure_url) product.image = cloudinaryResponse.secure_url;

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
