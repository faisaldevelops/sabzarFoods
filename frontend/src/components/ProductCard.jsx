import { ShoppingCart, AlertCircle, Tag, Zap, Plus, Minus, Bell } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";
import { useState } from "react";
import BuyNowModal from "./BuyNowModal";
import WaitlistModal from "./WaitlistModal";

const ProductCard = ({ product }) => {
	const { addToCart, cart, updateQuantity } = useCartStore();
	const [showBuyNow, setShowBuyNow] = useState(false);
	const [showWaitlist, setShowWaitlist] = useState(false);
	
	// Calculate available stock (stock - reserved)
	const availableStock = (product.stockQuantity || 0) - (product.reservedQuantity || 0);
	const isOutOfStock = availableStock <= 0;
	const isLowStock = availableStock > 0 && availableStock < 10;
	
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
			<div className='group relative flex w-full flex-col overflow-hidden bg-white rounded-xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-stone-200/50 hover:border-stone-300/60 transition-all duration-300'>
				{/* Image Container */}
				<div className='relative flex h-56 sm:h-64 overflow-hidden bg-stone-100 rounded-t-xl'>
					<img 
						className='object-cover w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]' 
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
								<button
									onClick={() => setShowWaitlist(true)}
									className='mt-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-full flex items-center gap-1 transition-colors'
								>
									<Bell size={12} />
									Notify Me
								</button>
							</div>
						</div>
					)}
					
					{/* Low stock badge */}
					{isLowStock && (
						<div className='absolute top-3 right-3'>
							<span className='bg-amber-500/90 backdrop-blur-sm text-white text-[10px] sm:text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm'>
								<Tag size={10} />
								{availableStock} left
							</span>
						</div>
					)}
				</div>

				{/* Content */}
				<div className='p-3 sm:p-4 flex flex-col flex-grow bg-white rounded-b-xl'>
					<h5 className='text-sm font-medium text-stone-800 mb-1.5 line-clamp-2 leading-snug'>
						{product.name}
					</h5>
					
					<div className='mt-auto pt-2'>
						<div className='flex items-baseline gap-2 mb-3'>
							<span className='text-lg sm:text-xl font-semibold text-stone-900'>
								₹{product.price}
							</span>
							{product.actualPrice && product.actualPrice > product.price && (
								<>
									<span className='text-xs sm:text-sm text-stone-400 line-through'>
										₹{product.actualPrice}
									</span>
									<span className='text-[10px] sm:text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full'>
										{Math.round(((product.actualPrice - product.price) / product.actualPrice) * 100)}% off
									</span>
								</>
							)}
						</div>
						
						<div className='flex sm:flex-row flex-col gap-2'>
							{quantityInCart === 0 ? (
								<button
									className={`flex-1 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
										isOutOfStock
											? 'bg-stone-100 text-stone-400 cursor-not-allowed'
											: 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.98]'
									}`}
									onClick={handleAddToCart}
									disabled={isOutOfStock}
								>
									{!isOutOfStock && <ShoppingCart size={14} />}
									{isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
								</button>
							) : (
								<div className='flex-1 flex items-center justify-center gap-3 rounded-lg bg-stone-900 px-3 py-2'>
									<button
										className='h-7 w-7 flex items-center justify-center rounded-full
										bg-stone-700 hover:bg-stone-600 focus:outline-none transition-colors active:scale-95'
										onClick={handleDecreaseQuantity}
									>
										<Minus className='text-white' size={14} />
									</button>
									<span className='text-sm font-medium text-white min-w-[1.5rem] text-center'>
										{quantityInCart}
									</span>
									<button
										className='h-7 w-7 flex items-center justify-center rounded-full
										bg-stone-700 hover:bg-stone-600 focus:outline-none transition-colors active:scale-95'
										onClick={handleIncreaseQuantity}
									>
										<Plus className='text-white' size={14} />
									</button>
								</div>
							)}
							
							<button
								className={`flex-1 px-3 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 ${
									isOutOfStock
										? 'bg-stone-100 text-stone-400 cursor-not-allowed'
										: 'bg-stone-100 text-stone-900 hover:bg-stone-200 active:scale-[0.98]'
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
			
			<WaitlistModal
				isOpen={showWaitlist}
				onClose={() => setShowWaitlist(false)}
				product={product}
			/>
		</>
	);
};
export default ProductCard;
