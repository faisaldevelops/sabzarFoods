import { Minus, Plus, Trash } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity } = useCartStore();

	return (
		<div className='border border-neutral-800 p-6 bg-black'>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<img className='h-20 md:h-32 object-cover' src={item.image} />
				</div>
				<label className='sr-only'>Choose quantity:</label>

				<div className='flex items-center justify-between md:order-3 md:justify-end'>
					<div className='flex items-center gap-3'>
						<button
							className='h-8 w-8 flex items-center justify-center border border-neutral-700 
							 bg-black hover:bg-neutral-900 focus:outline-none transition-colors'
							onClick={() => updateQuantity(item._id, item.quantity - 1)}
						>
							<Minus className='text-white' size={14} />
						</button>
						<p className='text-sm font-medium'>{item.quantity}</p>
						<button
							className='h-8 w-8 flex items-center justify-center border border-neutral-700 
							 bg-black hover:bg-neutral-900 focus:outline-none transition-colors'
							onClick={() => updateQuantity(item._id, item.quantity + 1)}
						>
							<Plus className='text-white' size={14} />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p className='text-base font-semibold text-white'>${item.price}</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md'>
					<p className='text-sm font-medium text-white'>
						{item.name}
					</p>
					<p className='text-xs text-neutral-500'>{item.description}</p>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-xs font-medium text-neutral-400
							 hover:text-white transition-colors'
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
