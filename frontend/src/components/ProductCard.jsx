import { ShoppingCart, AlertCircle, Tag } from "lucide-react";
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
		<div className='group relative flex w-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-white hover:shadow-lg transition-all duration-300'>
			{/* Image Container */}
			<div className='relative flex h-64 overflow-hidden bg-stone-100 rounded-t-lg'>
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
							${product.price}
						</span>
					</div>
					
					<button
						className={`w-full px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${
							isOutOfStock
								? 'bg-stone-200 text-stone-500 cursor-not-allowed'
								: 'bg-stone-800 text-white hover:bg-stone-700 hover:shadow-md'
						}`}
						onClick={handleAddToCart}
						disabled={isOutOfStock}
					>
						{!isOutOfStock && <ShoppingCart size={16} />}
						{isOutOfStock ? 'OUT OF STOCK' : 'Add to Cart'}
					</button>
				</div>
			</div>
		</div>
	);
};
export default ProductCard;
