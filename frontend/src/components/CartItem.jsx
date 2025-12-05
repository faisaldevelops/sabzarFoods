import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity } = useCartStore();

	return (
		<div className='border border-stone-200 rounded-lg p-6 bg-white shadow-sm'>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<img className='h-20 md:h-32 object-cover rounded-md' src={item.image} />
				</div>
				<label className='sr-only'>Choose quantity:</label>

				<div className='flex items-center justify-between md:order-3 md:justify-end'>
					<div className='flex items-center gap-3'>
						<button
							className='h-8 w-8 flex items-center justify-center border border-stone-300 rounded-md
							 bg-white hover:bg-stone-100 focus:outline-none transition-colors'
							onClick={() => updateQuantity(item._id, item.quantity - 1)}
						>
							<Minus className='text-stone-700' size={14} />
						</button>
						<p className='text-sm font-medium text-stone-900 min-w-[2rem] text-center'>{item.quantity}</p>
						<button
							className='h-8 w-8 flex items-center justify-center border border-stone-300 rounded-md
							 bg-white hover:bg-stone-100 focus:outline-none transition-colors'
							onClick={() => updateQuantity(item._id, item.quantity + 1)}
						>
							<Plus className='text-stone-700' size={14} />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p className='text-base font-bold text-stone-900'>₹{item.price}</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md'>
					<p className='text-sm font-medium text-stone-900'>
						{item.name}
					</p>
					<p className='text-xs text-stone-600'>{item.description}</p>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-xs font-medium text-stone-600
							 hover:text-red-600 transition-colors'
							onClick={() => removeFromCart(item._id)}
						>
							<Trash size={14} className='mr-1' />
							Remove
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
export default CartItem;
