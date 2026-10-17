import { useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import toast from "react-hot-toast";
import { validateImageFile, readFileAsBase64 } from "../lib/imageValidation";
import DeliveryRestrictionSelector from "./DeliveryRestrictionSelector";

const initialProductState = {
	name: "",
	description: "",
	actualPrice: "",
	price: "",
	image: "",
	stockQuantity: "",
	isRestricted: false,
	restrictionType: "none",
	restrictedPincodes: [],
	restrictedLocations: [],
};

const CreateProductForm = () => {
	const [newProduct, setNewProduct] = useState(initialProductState);

	const { createProduct, loading } = useProductStore();

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validate restrictions if set
		if (newProduct.restrictionType === "pincodes" && (!newProduct.restrictedPincodes || newProduct.restrictedPincodes.length === 0)) {
			toast.error("Please add at least one PIN code, or select All India");
			return;
		}

		if (newProduct.restrictionType === "districts" && (!newProduct.restrictedLocations || newProduct.restrictedLocations.length === 0)) {
			toast.error("Please select at least one district, or select All India");
			return;
		}

		try {
			await createProduct(newProduct);
			setNewProduct(initialProductState);
		} catch {
			console.log("error creating a product");
		}
	};

	const handleImageChange = async (e) => {
		const file = e.target.files[0];
		const validatedFile = validateImageFile(file, e.target);
		
		if (validatedFile) {
			try {
				const base64 = await readFileAsBase64(validatedFile);
				setNewProduct({ ...newProduct, image: base64 });
			} catch (error) {
				toast.error('Failed to read image file');
				e.target.value = '';
			}
		}
	};

	return (
		<motion.div
			className='bg-gray-800 shadow-lg rounded-lg p-8 mb-8 max-w-3xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<h2 className='text-2xl font-semibold mb-6 text-emerald-300'>Create New Product</h2>

			<form onSubmit={handleSubmit} className='space-y-4'>
				<div>
					<label htmlFor='name' className='block text-sm font-medium text-gray-300'>
						Product Name
					</label>
					<input
						type='text'
						id='name'
						name='name'
						value={newProduct.name}
						onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2
						 px-3 text-white focus:outline-none focus:ring-2
						focus:ring-emerald-500 focus:border-emerald-500'
						required
					/>
				</div>

				<div>
					<label htmlFor='description' className='block text-sm font-medium text-gray-300'>
						Description
					</label>
					<textarea
						id='description'
						name='description'
						value={newProduct.description}
						onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
						rows='3'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm
						 py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 
						 focus:border-emerald-500'
						required
					/>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<div>
						<label htmlFor='actualPrice' className='block text-sm font-medium text-gray-300'>
							Actual Price (MRP)
						</label>
						<input
							type='number'
							id='actualPrice'
							name='actualPrice'
							value={newProduct.actualPrice}
							onChange={(e) => setNewProduct({ ...newProduct, actualPrice: e.target.value })}
							step='0.01'
							className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
							py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
							 focus:border-emerald-500'
							required
						/>
					</div>
					<div>
						<label htmlFor='price' className='block text-sm font-medium text-gray-300'>
							Selling Price
						</label>
						<input
							type='number'
							id='price'
							name='price'
							value={newProduct.price}
							onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
							step='0.01'
							className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
							py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
							 focus:border-emerald-500'
							required
						/>
					</div>
				</div>

				<div>
					<label htmlFor='stockQuantity' className='block text-sm font-medium text-gray-300'>
						Stock Quantity
					</label>
					<input
						type='number'
						id='stockQuantity'
						name='stockQuantity'
						value={newProduct.stockQuantity}
						onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
						min='0'
						step='1'
						className='mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm 
						py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500
						 focus:border-emerald-500'
						required
					/>
				</div>

				<div className='mt-1 flex items-center'>
					<input type='file' id='image' className='sr-only' accept='image/*' onChange={handleImageChange} />
					<label
						htmlFor='image'
						className='cursor-pointer bg-gray-700 py-2 px-3 border border-gray-600 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-300 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
					>
						<Upload className='h-5 w-5 inline-block mr-2' />
						Upload Image
					</label>
					{newProduct.image && <span className='ml-3 text-sm text-gray-400'>Image uploaded </span>}
				</div>

				{/* Delivery / Area Restrictions */}
				<DeliveryRestrictionSelector
					restrictionType={newProduct.restrictionType}
					restrictedPincodes={newProduct.restrictedPincodes}
					restrictedLocations={newProduct.restrictedLocations}
					onChange={(restrictionData) => {
						setNewProduct((prev) => ({
							...prev,
							...restrictionData,
						}));
					}}
				/>

				<button
					type='submit'
					className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
					shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 
					focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50'
					disabled={loading}
				>
					{loading ? (
						<>
							<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
							Loading...
						</>
					) : (
						<>
							<PlusCircle className='mr-2 h-5 w-5' />
							Create Product
						</>
					)}
				</button>
			</form>
		</motion.div>
	);
};
export default CreateProductForm;
