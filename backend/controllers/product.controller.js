import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import { extractCloudinaryPublicId } from "../lib/cloudinaryUtils.js";
import { notifyWaitlist } from "./waitlist.controller.js";

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
		const { name, description, price, image, stockQuantity } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			stockQuantity: stockQuantity || 0,
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

		const wasOutOfStock = (product.stockQuantity || 0) - (product.reservedQuantity || 0) <= 0;

		if (stockQuantity !== undefined) {
			product.stockQuantity = stockQuantity;
		}

		const updatedProduct = await product.save();
		
		// Check if product is now back in stock
		const isNowInStock = (updatedProduct.stockQuantity || 0) - (updatedProduct.reservedQuantity || 0) > 0;
		
		// If product was out of stock and is now in stock, notify waitlist
		if (wasOutOfStock && isNowInStock) {
			console.log(`Product ${updatedProduct.name} is back in stock, notifying waitlist...`);
			notifyWaitlist(updatedProduct._id.toString()).catch(err => {
				console.error("Error notifying waitlist:", err);
			});
		}
		
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProductStock controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

const updateStock = (stockQuantity, product) => {
	const wasOutOfStock = (product.stockQuantity || 0) - (product.reservedQuantity || 0) <= 0;
	product.stockQuantity = stockQuantity;
	const isNowInStock = (product.stockQuantity || 0) - (product.reservedQuantity || 0) > 0;

	if (wasOutOfStock && isNowInStock) {
		console.log(`Product ${product.name} is back in stock, notifying waitlist...`);
		notifyWaitlist(product._id.toString()).catch(err => {
			console.error("Error notifying waitlist:", err);
		});
	}
}

export const updateProduct = async (req, res) => {
	try {
		const { name, description, price, image, stockQuantity } = req.body;
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
		if (price !== undefined) product.price = price;
		if (stockQuantity !== undefined) updateStock(stockQuantity, product);
		if (cloudinaryResponse?.secure_url) product.image = cloudinaryResponse.secure_url;
		
		const updatedProduct = await product.save();
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
