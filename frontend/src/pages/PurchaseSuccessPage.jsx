import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const { clearCart } = useCartStore();
	const [error, setError] = useState(null);
	const [id, setId] = useState(null)

	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		const orderId = params.get("orderId") || params.get("order_id");
		setId(orderId)

		if (!orderId) {
			setIsProcessing(false);
			setError("No orderId (or session_id) found in the URL");
			return;
		}

		(async () => {
			try {
			// If you want to fetch order details from backend (recommended)
			// make sure axios.baseURL points to your backend or you use full URL
			// const res = await axios.get(`/orders/${orderId}`);
			// setOrderInfo(res.data);

			clearCart();
			
			} catch (err) {
			console.error("failed to fetch order:", err);
			setError("Failed to fetch order details");
			} finally {
			setIsProcessing(false);
			}
		})();
	}, [clearCart]);


	if (isProcessing) return "Processing...";

	if (error) return `Error: ${error}`;

	return (
		<div className='h-screen flex items-center justify-center px-4'>
			<Confetti
				width={window.innerWidth}
				height={window.innerHeight}
				gravity={0.1}
				style={{ zIndex: 99 }}
				numberOfPieces={700}
				recycle={false}
			/>

			<div className='max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden relative z-10 border border-stone-200'>
				<div className='p-6 sm:p-8'>
					<div className='flex justify-center'>
						<CheckCircle className='text-stone-900 w-16 h-16 mb-4' />
					</div>
					<h1 className='text-2xl sm:text-3xl font-bold text-center text-stone-900 mb-2'>
						Purchase Successful!
					</h1>

					<p className='text-stone-700 text-center mb-2'>
						Thank you for your order. {"We're"} processing it now.
					</p>
					<p className='text-stone-600 text-center text-sm mb-6'>
						Check your email for order details and updates.
					</p>
					<div className='bg-stone-100 rounded-lg p-4 mb-6 border border-stone-200'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-stone-600'>Order number</span>
							<span className='text-sm font-semibold text-stone-900'>{id}</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-stone-600'>Estimated delivery</span>
							<span className='text-sm font-semibold text-stone-900'>3-5 business days</span>
						</div>
					</div>

					<div className='space-y-4'>
						<Link
							to={"/my-orders"}
							className='w-full bg-stone-800 hover:bg-stone-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center'
						>
							<HandHeart className='mr-2' size={18} />
							Thanks for trusting us! View Orders
						</Link>
						<Link
							to={"/"}
							className='w-full bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold py-2 px-4 border border-stone-300
            rounded-lg transition duration-300 flex items-center justify-center'
						>
							Continue Shopping
							<ArrowRight className='ml-2' size={18} />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};
export default PurchaseSuccessPage;
