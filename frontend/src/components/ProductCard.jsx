import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
	const { addToCart } = useCartStore();
	const isOutOfStock = !product.stockQuantity || product.stockQuantity === 0;
	const isLowStock = product.stockQuantity > 0 && product.stockQuantity < 10;
	
	const handleAddToCart = () => {
		if (isOutOfStock) {
			toast.error("This item is currently out of stock");
			return;
		}
		addToCart(product);
	};

	return (
		<div className='group relative flex w-full flex-col overflow-hidden border border-neutral-800 bg-black hover:border-neutral-600 transition-colors'>
			{/* Image Container */}
			<div className='relative flex h-64 overflow-hidden bg-neutral-900'>
				<img 
					className='object-cover w-full transition-transform duration-500 group-hover:scale-105' 
					src={product.image} 
					alt={product.name} 
				/>
				
				{/* Overlay for out of stock */}
				{isOutOfStock && (
					<div className='absolute inset-0 bg-black/80 flex items-center justify-center'>
						<span className='text-white text-sm font-medium tracking-wide'>
							OUT OF STOCK
						</span>
					</div>
				)}
				
				{/* Low stock badge */}
				{isLowStock && (
					<div className='absolute top-3 right-3'>
						<span className='bg-white text-black text-xs font-medium px-2 py-1'>
							{product.stockQuantity} LEFT
						</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className='p-4 flex flex-col flex-grow'>
				<h5 className='text-sm font-medium text-white mb-1 line-clamp-2'>
					{product.name}
				</h5>
				
				<div className='mt-auto pt-3'>
					<div className='flex items-baseline justify-between mb-3'>
						<span className='text-lg font-semibold text-white'>
							${product.price}
						</span>
					</div>
					
					<button
						className={`w-full px-4 py-3 text-xs font-medium tracking-wide transition-colors ${
							isOutOfStock
								? 'bg-neutral-900 text-neutral-600 cursor-not-allowed border border-neutral-800'
								: 'bg-white text-black hover:bg-neutral-200'
						}`}
						onClick={handleAddToCart}
						disabled={isOutOfStock}
					>
						{isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART'}
					</button>
				</div>
			</div>
		</div>
	);
};
export default ProductCard;
