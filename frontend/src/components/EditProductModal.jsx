import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const EditProductModal = ({ product, onClose }) => {
	const [editedProduct, setEditedProduct] = useState({
		name: product.name || "",
		description: product.description || "",
		price: product.price || "",
		image: product.image || "",
		stockQuantity: product.stockQuantity || "",
	});
	const [isImageUploading, setIsImageUploading] = useState(false);

	const { updateProduct, loading } = useProductStore();

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await updateProduct(product._id, editedProduct);
			onClose();
		} catch {
			console.log("Error updating product");
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setIsImageUploading(true);
			const reader = new FileReader();

			reader.onloadend = () => {
				setEditedProduct({ ...editedProduct, image: reader.result });
				setIsImageUploading(false);
			};

			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<motion.div
				className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto"
				initial={{ opacity: 0, scale: 0.9 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.9 }}
				transition={{ duration: 0.3 }}
			>
				<div className="flex justify-between items-center mb-6">
					<h2 className="text-2xl font-semibold text-emerald-300">Edit Product</h2>
					<button
						onClick={onClose}
						className="text-gray-400 hover:text-gray-200 focus:outline-none"
					>
						<X className="h-6 w-6" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium text-gray-300">
							Product Name
						</label>
						<input
							type="text"
							id="name"
							name="name"
							value={editedProduct.name}
							onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
							className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
							 px-3 text-white focus:outline-none focus:ring-2
							focus:ring-emerald-500 focus:border-emerald-500"
							required
						/>
					</div>

					<div>
						<label htmlFor="description" className="block text-sm font-medium text-gray-300">
							Description
						</label>
						<textarea
							id="description"
							name="description"
							value={editedProduct.description}
							onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
							rows="3"
							className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
							 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 
							 focus:border-emerald-500"
							required
						/>
					</div>

					<div>
						<label htmlFor="price" className="block text-sm font-medium text-gray-300">
							Price
						</label>
						<input
							type="number"
							id="price"
							name="price"
							value={editedProduct.price}
							onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
							step="0.01"
							className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
							py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
							 focus:border-emerald-500"
							required
						/>
					</div>

					<div>
						<label htmlFor="stockQuantity" className="block text-sm font-medium text-gray-300">
							Stock Quantity
						</label>
						<input
							type="number"
							id="stockQuantity"
							name="stockQuantity"
							value={editedProduct.stockQuantity}
							onChange={(e) => setEditedProduct({ ...editedProduct, stockQuantity: e.target.value })}
							min="0"
							step="1"
							className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
							py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
							 focus:border-emerald-500"
							required
						/>
					</div>

					<div className="mt-1 flex flex-col gap-2">
						{editedProduct.image && (
							<div className="mb-2">
								<img
									src={editedProduct.image}
									alt="Product preview"
									className="w-32 h-32 object-cover rounded-md"
								/>
							</div>
						)}
						<div className="flex items-center">
							<input
								type="file"
								id="image"
								className="sr-only"
								accept="image/*"
								onChange={handleImageChange}
							/>
							<label
								htmlFor="image"
								className="cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
							>
								<Upload className="h-5 w-5 inline-block mr-2" />
								{editedProduct.image ? "Change Image" : "Upload Image"}
							</label>
							{isImageUploading && (
								<span className="ml-3 text-sm text-gray-400">Uploading...</span>
							)}
						</div>
					</div>

					<div className="flex gap-3 mt-6">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md 
							shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 
							focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
							disabled={loading || isImageUploading}
						>
							{loading ? (
								<>
									<Loader className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
									Updating...
								</>
							) : (
								"Update Product"
							)}
						</button>
					</div>
				</form>
			</motion.div>
		</div>
	);
};

export default EditProductModal;
