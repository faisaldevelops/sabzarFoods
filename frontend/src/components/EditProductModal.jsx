import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const EditProductModal = ({ isOpen, onClose, product }) => {
	const [editedProduct, setEditedProduct] = useState({
		name: "",
		description: "",
		price: "",
		image: "",
		stockQuantity: "",
	});
	const [isImageUploading, setIsImageUploading] = useState(false);
	const { updateProduct, loading } = useProductStore();

	useEffect(() => {
		if (product) {
			setEditedProduct({
				name: product.name || "",
				description: product.description || "",
				price: product.price || "",
				image: product.image || "",
				stockQuantity: product.stockQuantity || "",
			});
		}
	}, [product]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await updateProduct(product._id, editedProduct);
			onClose();
		} catch (error) {
			console.log("error updating product");
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

			reader.onerror = () => {
				setIsImageUploading(false);
			};

			reader.readAsDataURL(file);
		}
	};

	if (!isOpen) return null;

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 overflow-y-auto">
					<div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
						{/* Background overlay */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-75"
							onClick={onClose}
						/>

						{/* Modal panel */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 20 }}
							className="inline-block w-full max-w-xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-gray-800 shadow-xl rounded-2xl relative"
						>
							<button
								onClick={onClose}
								className="absolute top-4 right-4 text-gray-400 hover:text-white"
							>
								<X className="w-6 h-6" />
							</button>

							<h2 className="text-2xl font-semibold mb-6 text-emerald-300">Edit Product</h2>

							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label htmlFor="edit-name" className="block text-sm font-medium text-gray-300">
										Product Name
									</label>
									<input
										type="text"
										id="edit-name"
										name="name"
										value={editedProduct.name}
										onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
										className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
										required
									/>
								</div>

								<div>
									<label htmlFor="edit-description" className="block text-sm font-medium text-gray-300">
										Description
									</label>
									<textarea
										id="edit-description"
										name="description"
										value={editedProduct.description}
										onChange={(e) => setEditedProduct({ ...editedProduct, description: e.target.value })}
										rows="3"
										className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
										required
									/>
								</div>

								<div>
									<label htmlFor="edit-price" className="block text-sm font-medium text-gray-300">
										Price
									</label>
									<input
										type="number"
										id="edit-price"
										name="price"
										value={editedProduct.price}
										onChange={(e) => setEditedProduct({ ...editedProduct, price: e.target.value })}
										step="0.01"
										className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
										required
									/>
								</div>

								<div>
									<label htmlFor="edit-stockQuantity" className="block text-sm font-medium text-gray-300">
										Stock Quantity
									</label>
									<input
										type="number"
										id="edit-stockQuantity"
										name="stockQuantity"
										value={editedProduct.stockQuantity}
										onChange={(e) => setEditedProduct({ ...editedProduct, stockQuantity: e.target.value })}
										min="0"
										step="1"
										className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
										required
									/>
								</div>

								<div className="mt-1 flex items-center">
									<input
										type="file"
										id="edit-image"
										className="sr-only"
										accept="image/*"
										onChange={handleImageChange}
									/>
									<label
										htmlFor="edit-image"
										className="cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
									>
										<Upload className="h-5 w-5 inline-block mr-2" />
										Upload New Image
									</label>
									{isImageUploading && (
										<span className="ml-3 text-sm text-yellow-400">Uploading image...</span>
									)}
								</div>

								{editedProduct.image && (
									<div className="mt-2">
										<img
											src={editedProduct.image}
											alt="Product preview"
											className="w-32 h-32 object-cover rounded-md"
										/>
									</div>
								)}

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
										className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
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
				</div>
			)}
		</AnimatePresence>
	);
};

export default EditProductModal;
