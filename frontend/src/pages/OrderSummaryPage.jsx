import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import AddressSelectionModal from "../components/AddressSelectionModal";
import InsufficientStockModal from "../components/InsufficientStockModal";
import CountdownTimer from "../components/CountdownTimer";
import { SHOP_CONFIG, PAYMENT_CONFIG } from "../config/constants";

const OrderSummaryPage = () => {
	const [orderData, setOrderData] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showAddressSelection, setShowAddressSelection] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null);
	const { user } = useUserStore();
	const navigate = useNavigate();

	useEffect(() => {
		// Retrieve pending order from localStorage
		const pendingOrder = localStorage.getItem("pendingBuyNowOrder");
		if (pendingOrder) {
			try {
				const parsed = JSON.parse(pendingOrder);
				setOrderData(parsed);
			} catch (error) {
				console.error("Failed to parse pending order:", error);
				toast.error("Unable to load your order. Please try placing your order again.");
				navigate("/");
			}
		} else {
			// No pending order, redirect to home
			navigate("/");
		}
	}, [navigate]);

	const handlePlaceOrder = () => {
		// Show address selection modal
		setShowAddressSelection(true);
	};

	const handleAddressSelected = (address) => {
		// Proceed to payment with selected address
		handlePayment(address);
	};

	const handlePayment = async (address) => {
		if (!address) return toast.error("Please add/select an address");
		if (!orderData) return toast.error("No order data found");

		setIsProcessing(true);
		try {
			// Create order with single product
			const orderProducts = [{
				product: orderData.product._id,
				quantity: orderData.quantity,
				price: orderData.product.price
			}];

			const res = await axios.post("/payments/razorpay-create-order", {
				products: orderProducts.map(item => ({
					...item,
					_id: item.product,
					name: orderData.product.name,
					image: orderData.product.image
				})),
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
							// Clear pending order
							localStorage.removeItem("pendingBuyNowOrder");
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
				theme: PAYMENT_CONFIG.theme,
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
	const handleReduceQuantity = (items) => {
		// Since this is a single product order, use the first item's available quantity
		if (items.length > 0 && items[0].available > 0) {
			setOrderData(prev => ({ ...prev, quantity: items[0].available }));
			setShowInsufficientStock(false);
			toast.success("Quantity updated to available stock");
		} else {
			setShowInsufficientStock(false);
			toast.error("Product is out of stock");
		}
	};

	// Handle browse similar items
	const handleBrowseSimilar = () => {
		setShowInsufficientStock(false);
		localStorage.removeItem("pendingBuyNowOrder");
		navigate("/");
	};

	// Handle join waitlist (placeholder)
	const handleJoinWaitlist = () => {
		toast.success("You'll be notified when this item is back in stock");
		setShowInsufficientStock(false);
	};

	// Handle hold expiration
	const handleHoldExpire = () => {
		toast.error("Your checkout session has expired. Please try again.");
		setHoldInfo(null);
		setIsProcessing(false);
	};

	if (!orderData) {
		return (
			<div className='min-h-screen bg-stone-50 flex items-center justify-center'>
				<div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-stone-800'></div>
			</div>
		);
	}

	const totalPrice = (orderData.product.price * orderData.quantity).toFixed(2);
	const extraCharges = SHOP_CONFIG.extraCharges;
	const finalTotal = (parseFloat(totalPrice) + extraCharges).toFixed(2);

	return (
		<div className='py-8 md:py-16 bg-stone-50 min-h-screen'>
			<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>				
				<div className='mt-6 sm:mt-8 md:gap-6 lg:flex lg:items-start xl:gap-8'>

					{/* Right side - Order Summary */}
					<motion.div
						className='mx-auto mt-6 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full'
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.4, delay: 0.2 }}
					>
						<div className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'>
							<p className='text-xl font-semibold text-emerald-400'>Payment Summary</p>

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
									<p className='text-sm font-semibold text-gray-300'>Item Details:</p>
									<div className='flex items-center justify-between gap-3 pb-2 border-b border-gray-700'>
										<div className='flex items-center gap-2 flex-1'>
											<img 
												src={orderData.product.image} 
												alt={orderData.product.name}
												className='w-10 h-10 rounded object-cover flex-shrink-0'
											/>
											<div className='flex-1 min-w-0'>
												<p className='text-xs text-gray-300 truncate'>{orderData.product.name}</p>
												<p className='text-xs text-gray-400'>Qty: {orderData.quantity}</p>
											</div>
										</div>
										<p className='text-sm font-medium text-white flex-shrink-0'>₹{totalPrice}</p>
									</div>
								</div>

								<div className='space-y-2'>
									<dl className='flex items-center justify-between gap-4'>
										<dt className='text-base font-normal text-gray-300'>Subtotal</dt>
										<dd className='text-base font-medium text-white'>₹{totalPrice}</dd>
									</dl>

									<dl className='flex items-center justify-between gap-4'>
										<dt className='text-base font-normal text-gray-300'>Extra Charges</dt>
										<dd className='text-base font-medium text-white'>₹{extraCharges.toFixed(2)}</dd>
									</dl>
									
									<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
										<dt className='text-base font-bold text-white'>Total</dt>
										<dd className='text-base font-bold text-emerald-400'>₹{finalTotal}</dd>
									</dl>
								</div>

								<motion.button
									className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed'
									whileHover={{ scale: isProcessing ? 1 : 1.05 }}
									whileTap={{ scale: isProcessing ? 1 : 0.95 }}
									onClick={handlePlaceOrder}
									disabled={isProcessing}
								>
									<ShoppingBag size={16} className="mr-2" />
									{isProcessing ? "Processing..." : "Proceed to Buy"}
								</motion.button>

								<button
									onClick={() => {
										localStorage.removeItem("pendingBuyNowOrder");
										navigate("/");
									}}
									className='w-full text-center text-sm text-emerald-400 hover:text-emerald-300 transition-colors'
								>
									Cancel and go back
								</button>
							</div>
						</div>
					</motion.div>
				</div>
			</div>

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
		</div>
	);
};

export default OrderSummaryPage;
