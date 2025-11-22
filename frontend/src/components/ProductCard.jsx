import { ShoppingCart } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import toast from "react-hot-toast";

const ProductCard = ({ product }) => {
	const { addToCart } = useCartStore();
	const isOutOfStock = !product.stockQuantity || product.stockQuantity === 0;
	
	const handleAddToCart = () => {
		if (isOutOfStock) {
			toast.error("This item is currently out of stock");
			return;
		}
		addToCart(product);
	};

	return (
		<div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-gray-700 shadow-lg'>
			<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
				<img className='object-cover w-full' src={product.image} alt='product image' />
				<div className='absolute inset-0 bg-black bg-opacity-20' />
				{isOutOfStock && (
					<div className='absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center'>
						<span className='text-white text-xl font-bold bg-red-600 px-4 py-2 rounded-lg'>
							OUT OF STOCK
						</span>
					</div>
				)}
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h5 className='text-xl font-semibold tracking-tight text-white'>{product.name}</h5>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span className='text-3xl font-bold text-emerald-400'>${product.price}</span>
					</p>
					{!isOutOfStock && product.stockQuantity < 10 && (
						<span className='text-xs text-yellow-400 font-medium'>
							Only {product.stockQuantity} left
						</span>
					)}
				</div>
				<button
					className={`flex items-center justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium text-white focus:outline-none focus:ring-4 transition-all ${
						isOutOfStock
							? 'bg-gray-600 cursor-not-allowed opacity-50'
							: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-300'
					}`}
					onClick={handleAddToCart}
					disabled={isOutOfStock}
				>
					<ShoppingCart size={22} className='mr-2' />
					{isOutOfStock ? 'Out of Stock' : 'Add to cart'}
				</button>
			</div>
		</div>
	);
};
export default ProductCard;
