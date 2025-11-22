import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import { Link } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useState } from "react";
import PhoneAuthModal from "./PhoneAuthModal";
import AddressSelectionModal from "./AddressSelectionModal";

const stripePromise = loadStripe(
	"pk_test_51KDTCDSGNvdrBQJJeyLX8rYoOFxOdHrwPskPEuzmFp0F5ol38avQCFyCl3sWyfMu7LoughhJBfigV3vxRHPBh7sO00R4FHN8Ja"
);

const OrderSummary = () => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPhoneAuth, setShowPhoneAuth] = useState(false);
	const [showAddressSelection, setShowAddressSelection] = useState(false);
	const [selectedAddress, setSelectedAddress] = useState(null);
	const { total, subtotal, cart } = useCartStore();
	const { user } = useUserStore();

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedTotal = total.toFixed(2);
	const formattedSavings = savings.toFixed(2);

	// const handlePayment = async () => {
	// 	console.log(selectedAddress);
		
	// 	if (!selectedAddress) {
	// 		return toast.error("Please add/select a shipping address before checkout");
	// 	}
	// 	const stripe = await stripePromise;
	// 	const res = await axios.post("/payments/create-checkout-session", {
	// 		products: cart,
	// 		couponCode: coupon ? coupon.code : null,
	// 		address: selectedAddress, // re-send here too
	// 	});

	// 	const session = res.data;
	// 	const result = await stripe.redirectToCheckout({
	// 		sessionId: session.id,
	// 	});

	// 	if (result.error) {
	// 		console.error("Error:", result.error);
	// 	}
	// };

	// inside OrderSummary component
	const handlePlaceOrder = () => {
		// Check if user is authenticated
		if (!user) {
			// Show phone auth modal
			setShowPhoneAuth(true);
			return;
		}

		// User is authenticated, show address selection modal
		setShowAddressSelection(true);
	};

	const handleAddressSelected = (address) => {
		setSelectedAddress(address);
		// Proceed to payment with selected address
		handlePayment(address);
	};

	const handlePayment = async (address) => {
		if (!address) return toast.error("Please add/select an address");
		if (!cart || cart.length === 0) return toast.error("Cart empty");

		setIsProcessing(true);
		try {
			const res = await axios.post("/payments/razorpay-create-order", {
			products: cart,
			address: address,
			});

			const { orderId, amount, currency, keyId, localOrderId } = res.data;

			// dynamically load Razorpay script (if not loaded)
			const rzpScriptLoaded = await new Promise((resolve) => {
			if (window.Razorpay) return resolve(true);
			const script = document.createElement("script");
			script.src = "https://checkout.razorpay.com/v1/checkout.js";
			script.onload = () => resolve(true);
			script.onerror = () => resolve(false);
			document.body.appendChild(script);
			});

			if (!rzpScriptLoaded) {
			toast.error("Failed to load Razorpay SDK");
			setIsProcessing(false);
			return;
			}

			const options = {
			key: keyId,
			amount: amount, // in paise (integer)
			currency: currency || "INR",
			name: "Your Shop Name",
			description: "Order Payment",
			order_id: orderId, // razorpay order id
			handler: async function (response) {
				// response contains razorpay_payment_id, razorpay_order_id, razorpay_signature
				try {
					const verifyRes = await axios.post("/payments/razorpay-verify", {
					razorpay_order_id: response.razorpay_order_id,
					razorpay_payment_id: response.razorpay_payment_id,
					razorpay_signature: response.razorpay_signature,
					localOrderId, // optional
				});

				if (verifyRes.data?.success) {
					toast.success("Payment successful!");
					// redirect to success page or show modal
					// window.location.href = `${process.env.REACT_APP_CLIENT_URL || ""}/purchase-success?orderId=${verifyRes.data.orderId}`;
					// window.location.href = `${import.meta.env.CLIENT_URL}/purchase-success?orderId=${verifyRes.data.orderId}`;
					window.location.href = `/purchase-success?orderId=${encodeURIComponent(orderId)}`;
				} else {
					toast.error(verifyRes.data?.message || "Verification failed");
				}
				} catch (err) {
				console.error("verify error", err);
				toast.error("Payment verification failed. Contact support.");
				} finally {
				setIsProcessing(false);
				}
			},
			prefill: {
				email: /* user email if available */ "",
				name: /* user name */ "",
				contact: /* phone */ "",
			},
			notes: {
				// any custom notes you want to store
			},
			theme: {
				color: "#10B981",
			},
			};

			const rzp = new window.Razorpay(options);
			rzp.open();
		} catch (err) {
			console.error(err);
			toast.error(err?.response?.data?.message || "Failed to create order");
			setIsProcessing(false);
		}
		};


	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order summary</p>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Original price</dt>
						<dd className='text-base font-medium text-white'>${formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Savings</dt>
							<dd className='text-base font-medium text-emerald-400'>-${formattedSavings}</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-emerald-400'>${formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300'
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handlePlaceOrder}
				>
					Buy
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-gray-400'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline'
					>
						Continue Shopping
						<MoveRight size={16} />
					</Link>
				</div>
			</div>
			
			<PhoneAuthModal 
				isOpen={showPhoneAuth} 
				onClose={() => setShowPhoneAuth(false)}
				onSuccess={(data) => {
					// After successful authentication, show address selection
					setShowAddressSelection(true);
				}}
			/>
			
			<AddressSelectionModal
				isOpen={showAddressSelection}
				onClose={() => setShowAddressSelection(false)}
				onSelectAddress={handleAddressSelected}
			/>
		</motion.div>
	);
};
export default OrderSummary;


// import { motion } from "framer-motion";
// import { useCartStore } from "../stores/useCartStore";
// import { useAddressStore } from "../stores/useAddressStore"; // import your address store
// import { Link } from "react-router-dom";
// import { MoveRight } from "lucide-react";
// import { loadStripe } from "@stripe/stripe-js";
// import axios from "../lib/axios";

// const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// const OrderSummary = () => {
//   const { total, subtotal, coupon, isCouponApplied, cart } = useCartStore();
//   const { address } = useAddressStore(); // address is array
//   // pick the address to use (adapt to your app's selected address logic)
//   const selectedAddress = Array.isArray(address) && address.length ? address[0] : null;

//   const handlePayment = async () => {
//     if (!selectedAddress) {
//       return toast.error("Please add/select a shipping address before checkout");
//     }

//     try {
//       const stripe = await stripePromise;

//       // 1) create checkout session and include address in body
//       const res = await axios.post("/payments/create-checkout-session", {
//         products: cart,
//         couponCode: coupon ? coupon.code : null,
//         address: selectedAddress, // included
//       });

//       const session = res.data;

//       // redirect to stripe checkout
//       const result = await stripe.redirectToCheckout({ sessionId: session.id });

//       if (result.error) console.error("Stripe redirect error:", result.error);
//     } catch (err) {
//       console.error(err);
//       toast.error(err.response?.data?.message || "Failed to start checkout");
//     }
//   };

//   return (
//     /* your existing JSX - keep unchanged */
//     <motion.button onClick={handlePayment}>Proceed to Checkout</motion.button>
//   );
// };
// export default OrderSummary;
