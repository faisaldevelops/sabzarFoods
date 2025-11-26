import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";

const CartPage = () => {
	const { cart } = useCartStore();

	return (
		<div className='py-8 md:py-16 bg-stone-50 min-h-screen'>
			<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
				<h1 className='text-3xl font-bold text-stone-900 mb-8 tracking-tight'>Shopping Cart</h1>
				<div className='mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8'>
					<motion.div
						className='mx-auto w-full flex-none lg:max-w-2xl xl:max-w-4xl'
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4, delay: 0.1 }}
					>
						{cart.length === 0 ? (
							<EmptyCartUI />
						) : (
							<div className='space-y-4'>
								{cart.map((item) => (
									<CartItem key={item._id} item={item} />
								))}
							</div>
						)}
						{cart.length > 0 && <PeopleAlsoBought />}
					</motion.div>

					{cart.length > 0 && (
						<motion.div
							className='mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full'
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.4, delay: 0.2 }}
						>
							<OrderSummary />
						</motion.div>
					)}
				</div>
			</div>
		</div>
	);
};
export default CartPage;

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center space-y-4 py-16 bg-white rounded-lg border border-stone-200 shadow-sm'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.4 }}
	>
		<ShoppingBag size={64} className='text-stone-300' />
		<h3 className='text-2xl font-bold text-stone-900'>Your cart is empty</h3>
		<p className='text-stone-600 text-sm'>Looks like you haven't added anything to your cart yet.</p>
		<Link
			className='mt-4 bg-stone-800 text-white px-6 py-3 text-sm font-medium rounded-md transition-all hover:bg-stone-700 hover:shadow-md flex items-center gap-2'
			to='/'
		>
			<ShoppingBag size={16} />
			Start Shopping
		</Link>
	</motion.div>
);
