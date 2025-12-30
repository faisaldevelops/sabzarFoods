import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity } = useCartStore();

	return (
		<div className='border border-stone-200 rounded-lg p-4 bg-white shadow-sm'>
			<div className='flex items-center gap-4'>
				<div className='shrink-0'>
					<img className='w-16 h-16 object-cover rounded-md' src={item.image} alt={item.name} />
				</div>

				<div className='flex-1 min-w-0'>
					<p className='text-sm font-medium text-stone-900 truncate'>
						{item.name}
					</p>
					<div className='flex items-baseline gap-2 mt-1'>
						{item.actualPrice && item.actualPrice > item.price && (
							<span className='text-sm text-stone-400 line-through'>₹{item.actualPrice}</span>
						)}
						<span className='text-base font-bold text-stone-900'>₹{item.price}</span>
					</div>
				</div>

				<div className='flex items-center gap-2'>
					<button
						className='h-7 w-7 flex items-center justify-center border border-stone-300 rounded-md
						 bg-white hover:bg-stone-100 focus:outline-none transition-colors'
						onClick={() => updateQuantity(item._id, item.quantity - 1)}
					>
						<Minus className='text-stone-700' size={12} />
					</button>
					<p className='text-sm font-medium text-stone-900 min-w-[1.5rem] text-center'>{item.quantity}</p>
					<button
						className='h-7 w-7 flex items-center justify-center border border-stone-300 rounded-md
						 bg-white hover:bg-stone-100 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
						onClick={() => updateQuantity(item._id, item.quantity + 1)}
						disabled={item.quantity >= 5}
					>
						<Plus className='text-stone-700' size={12} />
					</button>
				</div>

				<button
					className='inline-flex items-center text-xs font-medium text-stone-600
					 hover:text-red-600 transition-colors'
					onClick={() => removeFromCart(item._id)}
					title="Remove item"
				>
					<Trash size={16} />
				</button>
			</div>
		</div>
	);
};
export default CartItem;
