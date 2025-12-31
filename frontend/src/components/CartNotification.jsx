import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, X } from "lucide-react";
import { useEffect } from "react";

const CartNotification = () => {
	const { showCartNotification, lastAddedItem, hideCartNotification, cart } = useCartStore();
	const navigate = useNavigate();

	// Auto-hide after 4 seconds
	useEffect(() => {
		if (showCartNotification) {
			const timer = setTimeout(() => {
				hideCartNotification();
			}, 4000);
			return () => clearTimeout(timer);
		}
	}, [showCartNotification, hideCartNotification]);

	const handleGoToCart = () => {
		hideCartNotification();
		navigate("/cart");
	};

	const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

	return (
		<AnimatePresence>
			{showCartNotification && lastAddedItem && (
				<motion.div
					initial={{ y: 100, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: 100, opacity: 0 }}
					transition={{ type: "spring", damping: 25, stiffness: 300 }}
					className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-80 z-50"
				>
					<div className="bg-stone-900 text-white rounded-xl shadow-2xl overflow-hidden">
						{/* Main content */}
						<div className="flex items-center gap-3 p-3">
							{/* Product image */}
							<div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-800">
								<img
									src={lastAddedItem.image}
									alt={lastAddedItem.name}
									className="w-full h-full object-cover"
								/>
							</div>

							{/* Info */}
							<div className="flex-1 min-w-0">
								<p className="text-xs text-stone-400">Added to cart</p>
								<p className="text-sm font-medium truncate">{lastAddedItem.name}</p>
							</div>

							{/* Close button */}
							<button
								onClick={hideCartNotification}
								className="p-1 hover:bg-stone-800 rounded-full transition-colors flex-shrink-0"
							>
								<X size={16} className="text-stone-400" />
							</button>
						</div>

						{/* Go to cart button */}
						<button
							onClick={handleGoToCart}
							className="w-full flex items-center justify-center gap-2 bg-stone-800 hover:bg-stone-700 transition-colors py-2.5 px-4 text-sm font-medium"
						>
							<ShoppingBag size={16} />
							<span>View Cart ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
};

export default CartNotification;

