import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Plus, ChevronDown } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import AddressModal from "../components/AddressModal";
import InsufficientStockModal from "../components/InsufficientStockModal";
import CountdownTimer from "../components/CountdownTimer";
import { SHOP_CONFIG, PAYMENT_CONFIG } from "../config/constants";

const OrderSummaryPage = () => {
	const [orderData, setOrderData] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [showAddressDropdown, setShowAddressDropdown] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null);
	const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
	const [pricingBreakdown, setPricingBreakdown] = useState(null);
	const [loadingPricing, setLoadingPricing] = useState(false);
	const { user } = useUserStore();
	const { address: addresses, fetchAddresses, createAddress, loading: addressLoading } = useAddressStore();
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

	// Fetch addresses when user is logged in
	useEffect(() => {
		if (user) {
			fetchAddresses();
		}
	}, [user, fetchAddresses]);

	// Fetch pricing breakdown when address is selected and order data is available
	useEffect(() => {
		const fetchPricing = async () => {
			if (!orderData || !addresses || addresses.length === 0) {
				setPricingBreakdown(null);
				return;
			}

			const selectedAddress = addresses[selectedAddressIndex];
			if (!selectedAddress) {
				setPricingBreakdown(null);
				return;
			}

			const subtotal = orderData.product.price * orderData.quantity;
			setLoadingPricing(true);
			try {
				const res = await axios.post("/payments/calculate-pricing", {
					subtotal: subtotal,
					address: selectedAddress,
				});
				if (res.data.success) {
					setPricingBreakdown(res.data);
				}
			} catch (error) {
				console.error("Error fetching pricing:", error);
				// Silently fail - will use fallback
			} finally {
				setLoadingPricing(false);
			}
		};

		fetchPricing();
	}, [addresses, selectedAddressIndex, orderData]);

	// Set first address as selected by default when addresses are loaded
	useEffect(() => {
		if (addresses && addresses.length > 0 && selectedAddressIndex >= addresses.length) {
			setSelectedAddressIndex(0);
		}
	}, [addresses, selectedAddressIndex]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (showAddressDropdown && !event.target.closest('.address-dropdown-container')) {
				setShowAddressDropdown(false);
			}
		};

		if (showAddressDropdown) {
			document.addEventListener('mousedown', handleClickOutside);
			return () => document.removeEventListener('mousedown', handleClickOutside);
		}
	}, [showAddressDropdown]);

	const handlePlaceOrder = () => {
		// Check if address is selected
		if (!addresses || addresses.length === 0) {
			toast.error("Please add a delivery address");
			return;
		}

		// Proceed to payment with selected address
		const selectedAddress = addresses[selectedAddressIndex];
		handlePayment(selectedAddress);
	};

	const handleSaveNewAddress = async (addressData) => {
		try {
			await createAddress(addressData);
			setShowAddressForm(false);
			// Select the newly added address (will be at the end)
			if (addresses) {
				setSelectedAddressIndex(addresses.length);
			}
		} catch (error) {
			console.error("Error creating address:", error);
		}
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
	const finalTotal = pricingBreakdown 
		? pricingBreakdown.total.toFixed(2)
		: (parseFloat(totalPrice) + 199).toFixed(2); // Fallback to old calculation

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
								{/* Address Selection - Only show when user is logged in */}
								{user && (
									<div className='space-y-2'>
										<p className='text-sm font-semibold text-gray-300'>Delivery Address</p>
										{addresses && addresses.length > 0 ? (
											<div className='relative address-dropdown-container'>
												<button
													onClick={() => setShowAddressDropdown(!showAddressDropdown)}
													className='w-full text-left rounded-lg border border-gray-600 bg-gray-900 p-4 hover:bg-gray-800 transition-colors'
												>
													<div className='flex items-start gap-3'>
														<MapPin className='text-emerald-400 mt-1 flex-shrink-0' size={20} />
														<div className='flex-1 min-w-0'>
															<p className='font-medium text-white'>
																{addresses[selectedAddressIndex]?.name} • {addresses[selectedAddressIndex]?.phoneNumber}
															</p>
															{addresses[selectedAddressIndex]?.email && (
																<p className='text-sm text-gray-400'>{addresses[selectedAddressIndex]?.email}</p>
															)}
															<p className='text-sm text-gray-300 mt-1'>
																{addresses[selectedAddressIndex]?.houseNumber}, {addresses[selectedAddressIndex]?.streetAddress}
																{addresses[selectedAddressIndex]?.landmark && `, ${addresses[selectedAddressIndex]?.landmark}`}
															</p>
															<p className='text-sm text-gray-300'>
																{addresses[selectedAddressIndex]?.city}, {addresses[selectedAddressIndex]?.state} - {addresses[selectedAddressIndex]?.pincode}
															</p>
														</div>
														<ChevronDown className={`text-gray-400 flex-shrink-0 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} size={20} />
													</div>
												</button>

												{/* Address Dropdown */}
												{showAddressDropdown && (
													<div className='absolute z-10 w-full mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto address-dropdown-container'>
														{addresses.map((addr, index) => (
															<button
																key={addr._id || index}
																onClick={() => {
																	setSelectedAddressIndex(index);
																	setShowAddressDropdown(false);
																}}
																className={`w-full text-left p-4 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0 ${
																	selectedAddressIndex === index ? 'bg-gray-700' : ''
																}`}
															>
																<div className='flex items-start gap-3'>
																	<MapPin className='text-emerald-400 mt-1 flex-shrink-0' size={18} />
																	<div className='flex-1 min-w-0'>
																		<p className='font-medium text-white'>
																			{addr.name} • {addr.phoneNumber}
																		</p>
																		{addr.email && <p className='text-sm text-gray-400'>{addr.email}</p>}
																		<p className='text-sm text-gray-300 mt-1'>
																			{addr.houseNumber}, {addr.streetAddress}
																			{addr.landmark && `, ${addr.landmark}`}
																		</p>
																		<p className='text-sm text-gray-300'>
																			{addr.city}, {addr.state} - {addr.pincode}
																		</p>
																	</div>
																	{selectedAddressIndex === index && (
																		<div className='h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0'>
																			<svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
																				<path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
																			</svg>
																		</div>
																	)}
																</div>
															</button>
														))}
														<button
															onClick={() => {
																setShowAddressForm(true);
																setShowAddressDropdown(false);
															}}
															className='w-full flex items-center justify-center gap-2 p-4 text-gray-300 hover:bg-gray-700 transition-colors border-t border-gray-700'
														>
															<Plus size={18} />
															Add New Address
														</button>
													</div>
												)}
											</div>
										) : (
											<button
												onClick={() => setShowAddressForm(true)}
												className='w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 bg-gray-900 px-5 py-4 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors'
											>
												<Plus size={20} />
												Add Delivery Address
											</button>
										)}
									</div>
								)}

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

									{loadingPricing ? (
										<dl className='flex items-center justify-between gap-4'>
											<dt className='text-base font-normal text-gray-300'>Calculating charges...</dt>
											<dd className='text-base font-medium text-white'>...</dd>
										</dl>
									) : pricingBreakdown ? (
										<>
											<dl className='flex items-center justify-between gap-4'>
												<dt className='text-base font-normal text-gray-300'>Delivery Charges ({pricingBreakdown.deliveryType === 'local' ? 'Local' : 'National'})</dt>
												<dd className='text-base font-medium text-white'>₹{pricingBreakdown.deliveryCharge.toFixed(2)}</dd>
											</dl>
											<dl className='flex items-center justify-between gap-4'>
												<dt className='text-base font-normal text-gray-300'>Platform Fee</dt>
												<dd className='text-base font-medium text-white'>₹{pricingBreakdown.platformFee.total.toFixed(2)}</dd>
											</dl>
										</>
									) : (
										<dl className='flex items-center justify-between gap-4'>
											<dt className='text-base font-normal text-gray-300'>Extra Charges (Shipping + Platform Fee)</dt>
											<dd className='text-base font-medium text-white'>₹199.00</dd>
										</dl>
									)}
									
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

			<AddressModal
				isOpen={showAddressForm}
				onClose={() => setShowAddressForm(false)}
				onSave={handleSaveNewAddress}
				loading={addressLoading}
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
