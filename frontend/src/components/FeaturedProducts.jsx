import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const FeaturedProducts = ({ featuredProducts }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(4);

	const { addToCart } = useCartStore();
	const handleAddToCart = (product) => {
		if (!product.stockQuantity || product.stockQuantity === 0) {
			toast.error("This item is currently out of stock");
			return;
		}
		addToCart(product);
	};

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) setItemsPerPage(1);
			else if (window.innerWidth < 1024) setItemsPerPage(2);
			else if (window.innerWidth < 1280) setItemsPerPage(3);
			else setItemsPerPage(4);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	const nextSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
	};

	const isStartDisabled = currentIndex === 0;
	const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

	return (
		<div className='py-16'>
			<div className='container mx-auto px-4'>
				<h2 className='text-3xl sm:text-4xl font-bold text-stone-900 mb-8 tracking-tight'>Featured Products</h2>
				<div className='relative'>
					<div className='overflow-hidden'>
						<div
							className='flex transition-transform duration-500 ease-in-out'
							style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
						>
							{featuredProducts?.map((product) => {
								const isOutOfStock = !product.stockQuantity || product.stockQuantity === 0;
								return (
									<div key={product._id} className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2'>
										<div className='border border-stone-200 rounded-lg bg-white overflow-hidden h-full transition-all hover:shadow-xl'>
											<div className='overflow-hidden bg-stone-100 rounded-t-lg'>
												<img
													src={product.image}
													alt={product.name}
													className='w-full h-48 object-cover transition-transform duration-700 ease-out hover:scale-105'
												/>
											</div>
											<div className='p-4'>
												<h3 className='text-sm font-medium mb-2 text-stone-900 line-clamp-2'>{product.name}</h3>
												<p className='text-stone-900 font-bold mb-4 text-lg'>
													₹{product.price.toFixed(2)}
												</p>
												<button
													onClick={() => handleAddToCart(product)}
													disabled={isOutOfStock}
													className={`w-full font-medium py-2.5 px-4 text-sm rounded-md transition-all flex items-center justify-center gap-2 ${
														isOutOfStock
															? 'bg-stone-200 text-stone-500 cursor-not-allowed'
															: 'bg-stone-800 text-white hover:bg-stone-700 hover:shadow-md'
													}`}
												>
													{!isOutOfStock && <ShoppingCart size={16} />}
													{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
												</button>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
					<button
						onClick={prevSlide}
						disabled={isStartDisabled}
						className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full shadow-lg transition-all ${
							isStartDisabled ? "bg-stone-200 cursor-not-allowed text-stone-400" : "bg-white text-stone-800 hover:bg-stone-100 hover:shadow-xl"
						}`}
					>
						<ChevronLeft className='w-5 h-5' />
					</button>

					<button
						onClick={nextSlide}
						disabled={isEndDisabled}
						className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full shadow-lg transition-all ${
							isEndDisabled ? "bg-stone-200 cursor-not-allowed text-stone-400" : "bg-white text-stone-800 hover:bg-stone-100 hover:shadow-xl"
						}`}
					>
						<ChevronRight className='w-5 h-5' />
					</button>
				</div>
			</div>
		</div>
	);
};
export default FeaturedProducts;
