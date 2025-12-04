import { useEffect, useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { motion } from "framer-motion";

const HomePage = () => {
	const { fetchAllProducts, products, loading } = useProductStore();
	const [displayLimit, setDisplayLimit] = useState(12);

	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	if (loading) {
		return <LoadingSpinner />;
	}

	const displayedProducts = products?.slice(0, displayLimit) || [];
	const hasMore = products?.length > displayLimit;

	return (
		<div className='relative min-h-screen bg-stone-50 text-stone-900'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<h1 className='text-4xl sm:text-5xl font-bold text-stone-900 mb-3 tracking-tight'>
						Featured Products
					</h1>
					<p className='text-base text-stone-600 mb-12 font-light'>
						Discover the latest trends in fashion
					</p>
				</motion.div>

				<motion.div
					className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					{displayedProducts?.length === 0 && (
						<div className='col-span-full text-center py-12'>
							<p className='text-xl font-medium text-stone-600'>
								No products available
							</p>
						</div>
					)}

					{displayedProducts?.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</motion.div>

				{hasMore && (
					<div className='flex justify-center mt-12'>
						<button
							onClick={() => setDisplayLimit(prev => prev + 12)}
							className='px-6 py-3 bg-stone-800 text-white rounded-md hover:bg-stone-700 transition-colors duration-200 font-medium'
						>
							Load More
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
export default HomePage;
