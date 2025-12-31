import { useEffect } from "react";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

const HomePage = () => {
	const { fetchAllProducts, products, loading } = useProductStore();

	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	if (loading) {
		return <LoadingSpinner />;
	}

	return (
		<div className='relative min-h-screen bg-gradient-to-b from-stone-50 via-stone-50 to-stone-100 text-stone-900'>
			{/* Subtle decorative element */}
			<div className='absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-stone-100/50 to-transparent pointer-events-none' />
			
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'>
				<motion.div
					className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6'
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 0.15 }}
				>
					{products?.length === 0 && (
						<div className='col-span-full text-center py-16'>
							<p className='text-lg font-light text-stone-500'>
								No products available at the moment
							</p>
						</div>
					)}

					{products?.map((product, index) => (
						<motion.div
							key={product._id}
							className='h-full'
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: index * 0.05 }}
						>
							<ProductCard product={product} />
						</motion.div>
					))}
				</motion.div>
			</div>
		</div>
	);
};
export default HomePage;
