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
		<div className='relative min-h-screen bg-stone-50 text-stone-900'>
			<div className='relative z-10 max-w-7xl mx-auto sm:px-6 lg:px-8 py-16'>
				<motion.div
					className='grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0 sm:gap-6'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, delay: 0.1 }}
				>
					{products?.length === 0 && (
						<div className='col-span-full text-center py-12'>
							<p className='text-xl font-medium text-stone-600'>
								No products available
							</p>
						</div>
					)}

					{products?.map((product) => (
						<ProductCard key={product._id} product={product} />
					))}
				</motion.div>
			</div>
		</div>
	);
};
export default HomePage;
