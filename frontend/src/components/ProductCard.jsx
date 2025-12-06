import { ShoppingCart, AlertCircle, Tag, Zap, Plus, Minus } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";
import { useState } from "react";
import BuyNowModal from "./BuyNowModal";

const ProductCard = ({ product }) => {
	const { addToCart, cart, updateQuantity } = useCartStore();
	const [showBuyNow, setShowBuyNow] = useState(false);
	const isOutOfStock = !product.stockQuantity || product.stockQuantity === 0;
	const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
	
	// Check if product is in cart and get its quantity
	const cartItem = cart.find(item => item._id === product._id);
	const quantityInCart = cartItem ? cartItem.quantity : 0;
	
	const handleAddToCart = () => {
		if (isOutOfStock) {
			toast.error("This item is currently out of stock");
			return;
		}
		addToCart(product);
	};

	const handleIncreaseQuantity = () => {
		if (isOutOfStock) {
			toast.error("This item is currently out of stock");
			return;
		}
		updateQuantity(product._id, quantityInCart + 1);
	};

	const handleDecreaseQuantity = () => {
		if (quantityInCart > 0) {
			updateQuantity(product._id, quantityInCart - 1);
		}
	};

	const handleBuyNow = () => {
		if (isOutOfStock) {
			toast.error("This item is currently out of stock");
			return;
		}
		setShowBuyNow(true);
	};

	return (
		<>
			<div className='group relative flex w-full flex-col overflow-hidden border-r border-b sm:border border-gray-900 sm:rounded-lg bg-white hover:shadow-lg transition-all duration-300'>
				{/* Image Container */}
				<div className='relative flex h-64 overflow-hidden bg-stone-100 sm:rounded-t-lg'>
					<img 
						className='object-cover w-full transition-transform duration-500 group-hover:scale-105' 
						src={product.image} 
						alt={product.name} 
					/>
					
					{/* Overlay for out of stock */}
					{isOutOfStock && (
						<div className='absolute inset-0 bg-stone-900/80 flex items-center justify-center'>
							<div className='flex flex-col items-center gap-2'>
								<AlertCircle size={32} className='text-white' />
								<span className='text-white text-sm font-medium'>
									OUT OF STOCK
								</span>
							</div>
						</div>
					)}
					
					{/* Low stock badge */}
					{isLowStock && (
						<div className='absolute top-3 right-3'>
							<span className='bg-amber-500 text-white text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md'>
								<Tag size={12} />
								{product.stockQuantity} LEFT
							</span>
						</div>
					)}
				</div>

				{/* Content */}
				<div className='p-4 flex flex-col flex-grow bg-white'>
					<h5 className='text-sm font-medium text-stone-900 mb-1 line-clamp-2'>
						{product.name}
					</h5>
					
					<div className='mt-auto pt-3'>
						<div className='flex items-baseline justify-between mb-3'>
							<span className='text-xl font-bold text-stone-900'>
								₹{product.price}
							</span>
							{!isOutOfStock && (
								<span className='text-xs text-stone-500'>
									Qty: {product.stockQuantity}
								</span>
							)}
						</div>
						
						<div className='flex sm:flex-row flex-col gap-2'>
							{quantityInCart === 0 ? (
								<button
									className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
										isOutOfStock
											? 'bg-stone-200 text-stone-500 cursor-not-allowed'
											: 'bg-stone-800 text-white hover:bg-stone-700 hover:shadow-md'
									}`}
									onClick={handleAddToCart}
									disabled={isOutOfStock}
								>
									{!isOutOfStock && <ShoppingCart size={14} />}
									{isOutOfStock ? 'OUT OF STOCK' : 'Add to Cart'}
								</button>
							) : (
								<div className='flex-1 flex items-center justify-center gap-2 border border-stone-300 rounded-md bg-white px-2 py-2'>
									<button
										className='h-7 w-7 flex items-center justify-center border border-stone-300 rounded-md
										bg-white hover:bg-stone-100 focus:outline-none transition-colors'
										onClick={handleDecreaseQuantity}
									>
										<Minus className='text-stone-700' size={14} />
									</button>
									<span className='text-sm font-medium text-stone-900 min-w-[2rem] text-center'>
										{quantityInCart}
									</span>
									<button
										className='h-7 w-7 flex items-center justify-center border border-stone-300 rounded-md
										bg-white hover:bg-stone-100 focus:outline-none transition-colors'
										onClick={handleIncreaseQuantity}
									>
										<Plus className='text-stone-700' size={14} />
									</button>
								</div>
							)}
							
							<button
								className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
									isOutOfStock
										? 'bg-stone-200 text-stone-500 cursor-not-allowed'
										: 'bg-white text-stone-900 border border-stone-300 hover:bg-stone-50 hover:shadow-md'
								}`}
								onClick={handleBuyNow}
								disabled={isOutOfStock}
							>
								{!isOutOfStock && <Zap size={14} />}
								Buy Now
							</button>
						</div>
					</div>
				</div>
			</div>
			
			<BuyNowModal 
				isOpen={showBuyNow}
				onClose={() => setShowBuyNow(false)}
				product={product}
			/>
		</>
	);
};
export default ProductCard;
