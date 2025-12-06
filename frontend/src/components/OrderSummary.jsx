import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useState } from "react";
import PhoneAuthModal from "./PhoneAuthModal";
import AddressSelectionModal from "./AddressSelectionModal";
import InsufficientStockModal from "./InsufficientStockModal";
import CountdownTimer from "./CountdownTimer";
import { SHOP_CONFIG } from "../config/constants";

const OrderSummary = () => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPhoneAuth, setShowPhoneAuth] = useState(false);
	const [showAddressSelection, setShowAddressSelection] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null); // { expiresAt, localOrderId }
	const { total, subtotal, cart, updateQuantity } = useCartStore();
	const { user } = useUserStore();
	const navigate = useNavigate();

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const extraCharges = SHOP_CONFIG.extraCharges; // Extra charges in rupees
	const formattedTotal = (total + extraCharges).toFixed(2);
	const formattedSavings = savings.toFixed(2);

	// Handle place order button click
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

	const handleAuthSuccess = async () => {
		// Close phone auth modal and immediately open address selection
		setShowPhoneAuth(false);
		setShowAddressSelection(true);
	};

	const handleAddressSelected = (address) => {
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

			const { orderId, amount, currency, keyId, localOrderId, expiresAt, holdDurationSeconds } = res.data;

			// Store hold info for countdown timer
			setHoldInfo({ expiresAt, localOrderId, holdDurationSeconds });

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
				setHoldInfo(null);
				return;
			}

			const options = {
				key: keyId,
				amount: amount,
				currency: currency || "INR",
				name: SHOP_CONFIG.name,
				description: "Order Payment",
				order_id: orderId,
				handler: async function (response) {
					try {
						const verifyRes = await axios.post("/payments/razorpay-verify", {
							razorpay_order_id: response.razorpay_order_id,
							razorpay_payment_id: response.razorpay_payment_id,
							razorpay_signature: response.razorpay_signature,
							localOrderId,
						});

						if (verifyRes.data?.success) {
							toast.success("Payment successful!");
							setHoldInfo(null);
							window.location.href = `/purchase-success?orderId=${encodeURIComponent(orderId)}`;
						} else {
							// Check for insufficient stock error
							if (verifyRes.data?.insufficientStock) {
								setInsufficientItems(verifyRes.data.insufficientItems || []);
								setShowInsufficientStock(true);
							} else if (verifyRes.data?.holdExpired) {
								toast.error("Your session expired. Please try again.");
								setHoldInfo(null);
							} else {
								toast.error(verifyRes.data?.message || "Verification failed");
							}
						}
					} catch (err) {
						console.error("verify error", err);
						const errData = err?.response?.data;
						if (errData?.insufficientStock) {
							setInsufficientItems(errData.insufficientItems || []);
							setShowInsufficientStock(true);
						} else if (errData?.holdExpired) {
							toast.error("Your session expired. Please try again.");
							setHoldInfo(null);
						} else {
							toast.error("Payment verification failed. Contact support.");
						}
					} finally {
						setIsProcessing(false);
					}
				},
				modal: {
					ondismiss: async function () {
						// User closed the payment modal without completing
						setIsProcessing(false);
						// Optionally cancel the hold
						if (localOrderId) {
							try {
								await axios.post("/payments/cancel-hold", { localOrderId });
							} catch {
								// Silent fail - hold will expire automatically
							}
						}
						setHoldInfo(null);
					}
				},
				prefill: {
					email: user?.email || "",
					name: user?.name || address?.name || "",
					contact: user?.phoneNumber || address?.phoneNumber || "",
				},
				theme: {
					color: "#10B981",
				},
			};

			const rzp = new window.Razorpay(options);
			rzp.open();
		} catch (err) {
			console.error(err);
			const errData = err?.response?.data;
			if (errData?.insufficientStock) {
				setInsufficientItems(errData.insufficientItems || []);
				setShowInsufficientStock(true);
			} else {
				toast.error(errData?.message || "Failed to create order");
			}
			setIsProcessing(false);
			setHoldInfo(null);
		}
	};

	// Handle reduce quantity action from insufficient stock modal
	const handleReduceQuantity = async (items) => {
		// Use Promise.all for parallel updates
		await Promise.all(
			items.map(item => {
				if (item.available > 0 && item.productId) {
					return updateQuantity(item.productId.toString(), item.available);
				} else if (item.available === 0 && item.productId) {
					// Remove item from cart
					return updateQuantity(item.productId.toString(), 0);
				}
				return Promise.resolve();
			})
		);
		setShowInsufficientStock(false);
		toast.success("Cart updated with available quantities");
	};

	// Handle browse similar items
	const handleBrowseSimilar = () => {
		setShowInsufficientStock(false);
		navigate("/");
	};

	// Handle join waitlist (placeholder - could be implemented later)
	const handleJoinWaitlist = () => {
		toast.success("You'll be notified when items are back in stock");
		setShowInsufficientStock(false);
	};

	// Handle hold expiration
	const handleHoldExpire = () => {
		toast.error("Your checkout session has expired. Please try again.");
		setHoldInfo(null);
		setIsProcessing(false);
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order summary</p>

			{/* Countdown Timer when hold is active */}
			{holdInfo && (
				<CountdownTimer 
					expiresAt={holdInfo.expiresAt}
					durationSeconds={holdInfo.holdDurationSeconds}
					onExpire={handleHoldExpire}
				/>
			)}

			<div className='space-y-4'>
				{/* Item Breakdown */}
				<div className='space-y-2'>
					<p className='text-sm font-semibold text-gray-300'>Items in your order:</p>
					{cart.map((item) => (
						<div key={item._id} className='flex items-center justify-between gap-3 pb-2 border-b border-gray-700'>
							<div className='flex items-center gap-2 flex-1'>
								<img 
									src={item.image} 
									alt={item.name}
									className='w-10 h-10 rounded object-cover flex-shrink-0'
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-xs text-gray-300 truncate'>{item.name}</p>
									<p className='text-xs text-gray-400'>Qty: {item.quantity}</p>
								</div>
							</div>
							<p className='text-sm font-medium text-white flex-shrink-0'>₹{(item.price * item.quantity).toFixed(2)}</p>
						</div>
					))}
				</div>

				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Original price</dt>
						<dd className='text-base font-medium text-white'>₹{formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Savings</dt>
							<dd className='text-base font-medium text-emerald-400'>-₹{formattedSavings}</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Extra Charges</dt>
						<dd className='text-base font-medium text-white'>₹{extraCharges.toFixed(2)}</dd>
					</dl>
					<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-emerald-400'>₹{formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed'
					whileHover={{ scale: isProcessing ? 1 : 1.05 }}
					whileTap={{ scale: isProcessing ? 1 : 0.95 }}
					onClick={handlePlaceOrder}
					disabled={isProcessing}
				>
					{isProcessing ? "Processing..." : "Buy"}
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
				onSuccess={handleAuthSuccess}
			/>
			
			<AddressSelectionModal
				isOpen={showAddressSelection}
				onClose={() => setShowAddressSelection(false)}
				onSelectAddress={handleAddressSelected}
			/>

			<InsufficientStockModal
				isOpen={showInsufficientStock}
				onClose={() => setShowInsufficientStock(false)}
				insufficientItems={insufficientItems}
				onReduceQuantity={handleReduceQuantity}
				onBrowseSimilar={handleBrowseSimilar}
				onJoinWaitlist={handleJoinWaitlist}
			/>
		</motion.div>
	);
};
export default OrderSummary;
