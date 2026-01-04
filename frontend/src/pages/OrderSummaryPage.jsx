import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingBag, MapPin, Plus, ChevronDown, Check, ArrowLeft } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import AddressModal from "../components/AddressModal";
import LoginPromptModal from "../components/LoginPromptModal";
import InsufficientStockModal from "../components/InsufficientStockModal";
import CountdownTimer from "../components/CountdownTimer";
import { SHOP_CONFIG, PAYMENT_CONFIG } from "../config/constants";

const OrderSummaryPage = () => {
	const [orderData, setOrderData] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [showAddressDropdown, setShowAddressDropdown] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [showLoginPrompt, setShowLoginPrompt] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null);
	const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
	const [pricingBreakdown, setPricingBreakdown] = useState(null);
	const [loadingPricing, setLoadingPricing] = useState(false);
	const { user, checkAuth } = useUserStore();
	const { syncGuestCart } = useCartStore();
	const { address: addresses, fetchAddresses, createAddress, loading: addressLoading } = useAddressStore();
	const navigate = useNavigate();

	useEffect(() => {
		const pendingOrder = localStorage.getItem("pendingBuyNowOrder");
		if (pendingOrder) {
			try {
				const parsed = JSON.parse(pendingOrder);
				setOrderData(parsed);
			} catch (error) {
				console.error("Failed to parse pending order:", error);
				toast.error("Unable to load your order. Please try again.");
				navigate("/");
			}
		} else {
			navigate("/");
		}
	}, [navigate]);

	useEffect(() => {
		if (user) {
			fetchAddresses();
		}
	}, [user, fetchAddresses]);

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
			} finally {
				setLoadingPricing(false);
			}
		};

		fetchPricing();
	}, [addresses, selectedAddressIndex, orderData]);

	useEffect(() => {
		if (addresses && addresses.length > 0 && selectedAddressIndex >= addresses.length) {
			setSelectedAddressIndex(0);
		}
	}, [addresses, selectedAddressIndex]);

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

	// Handle Google sign-in success
	const handleGoogleSuccess = async (credentialResponse) => {
		setIsSigningIn(true);
		try {
			await axios.post("/auth/google", {
				credential: credentialResponse.credential,
			});
			await checkAuth();
			await syncGuestCart();
			const fetchedAddresses = await fetchAddresses();
			setShowLoginPrompt(false);
			
			// After successful login, check if user has addresses
			// If no addresses, show address form to continue checkout
			if (!fetchedAddresses || fetchedAddresses.length === 0) {
				setShowAddressForm(true);
			}
		} catch (error) {
			console.error("Login failed:", error);
			toast.error(error.response?.data?.message || "Sign in failed. Please try again.");
		} finally {
			setIsSigningIn(false);
		}
	};

	const handleGoogleError = () => {
		toast.error("Sign in failed. Please try again.");
	};

	const handlePlaceOrder = () => {
		// If user is not logged in, show login prompt
		if (!user) {
			setShowLoginPrompt(true);
			return;
		}

		// If user is logged in but has no addresses, show address form
		if (!addresses || addresses.length === 0) {
			setShowAddressForm(true);
			return;
		}

		const selectedAddress = addresses[selectedAddressIndex];
		handlePayment(selectedAddress);
	};

	const handleSaveNewAddress = async (addressData) => {
		try {
			await createAddress(addressData);
			setShowAddressForm(false);
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

			setHoldInfo({ expiresAt, localOrderId, holdDurationSeconds });

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
							localStorage.removeItem("pendingBuyNowOrder");
							window.location.href = `/purchase-success?orderId=${encodeURIComponent(orderId)}`;
						} else {
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
						setIsProcessing(false);
						if (localOrderId) {
							try {
								await axios.post("/payments/cancel-hold", { localOrderId });
							} catch {
								// Silent fail
							}
						}
						setHoldInfo(null);
					}
				},
			prefill: {
				email: user?.email || "",
				name: user?.name || address?.name || "",
				contact: address?.phoneNumber || "",
			},
			theme: PAYMENT_CONFIG.theme,
			config: {
				display: {
					blocks: {
						payments: {
							name: "Payment Methods",
							instruments: [
								{
									method: "upi",
									apps: ["google_pay", "phonepe", "paytm"]
								},
								{ method: "card" }
							]
						}
					},
					sequence: ["block.payments"],
					preferences: {
						show_default_blocks: false
					}
				}
			}
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

	const handleReduceQuantity = (items) => {
		if (items.length > 0 && items[0].available > 0) {
			setOrderData(prev => ({ ...prev, quantity: items[0].available }));
			setShowInsufficientStock(false);
			toast.success("Quantity updated to available stock");
		} else {
			setShowInsufficientStock(false);
			toast.error("Product is out of stock");
		}
	};

	const handleBrowseSimilar = () => {
		setShowInsufficientStock(false);
		localStorage.removeItem("pendingBuyNowOrder");
		navigate("/");
	};

	const handleJoinWaitlist = () => {
		toast.success("You'll be notified when this item is back in stock");
		setShowInsufficientStock(false);
	};

	const handleHoldExpire = () => {
		toast.error("Your checkout session has expired. Please try again.");
		setHoldInfo(null);
		setIsProcessing(false);
	};

	if (!orderData) {
		return (
			<div className='min-h-screen bg-stone-50 flex items-center justify-center'>
				<div className='animate-spin rounded-full h-8 w-8 border-2 border-stone-800 border-t-transparent'></div>
			</div>
		);
	}

	const totalPrice = (orderData.product.price * orderData.quantity).toFixed(2);
	const finalTotal = pricingBreakdown 
		? pricingBreakdown.total.toFixed(2)
		: totalPrice;

	const currentStep = !user ? 1 : (!addresses || addresses.length === 0) ? 2 : 3;

	return (
		<div className='py-8 bg-stone-50 min-h-screen'>
			<div className='mx-auto max-w-lg px-4'>
				{/* Back Button */}
				<button
					onClick={() => {
						localStorage.removeItem("pendingBuyNowOrder");
						navigate(-1);
					}}
					className='flex items-center gap-1 text-sm text-stone-600 hover:text-stone-800 mb-4'
				>
					<ArrowLeft size={16} />
					Back
				</button>

				<motion.div
					className='rounded-lg border border-stone-200 bg-white p-5 shadow-sm'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
				>
					<h1 className='text-xl font-semibold text-stone-900 mb-4'>Checkout</h1>

					{/* Progress Steps */}
					<div className='flex items-center gap-2 pb-4 border-b border-stone-200 mb-4'>
						<div className='flex items-center gap-2'>
							<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
								user ? 'bg-stone-800 text-white' : 'bg-stone-200 text-stone-600'
							}`}>
								{user ? <Check size={14} /> : '1'}
							</div>
							<span className={`text-sm ${user ? 'text-stone-500' : 'text-stone-900 font-medium'}`}>
								Sign in
							</span>
						</div>
						<div className='flex-1 h-px bg-stone-200' />
						<div className='flex items-center gap-2'>
							<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
								addresses && addresses.length > 0 ? 'bg-stone-800 text-white' : user ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-400'
							}`}>
								{addresses && addresses.length > 0 ? <Check size={14} /> : '2'}
							</div>
							<span className={`text-sm ${currentStep === 2 ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
								Address
							</span>
						</div>
						<div className='flex-1 h-px bg-stone-200' />
						<div className='flex items-center gap-2'>
							<div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
								currentStep === 3 ? 'bg-stone-200 text-stone-600' : 'bg-stone-100 text-stone-400'
							}`}>
								3
							</div>
							<span className={`text-sm ${currentStep === 3 ? 'text-stone-900 font-medium' : 'text-stone-500'}`}>
								Pay
							</span>
						</div>
					</div>

					{/* Countdown Timer */}
					{holdInfo && (
						<CountdownTimer 
							expiresAt={holdInfo.expiresAt}
							durationSeconds={holdInfo.holdDurationSeconds}
							onExpire={handleHoldExpire}
						/>
					)}

					<div className='space-y-4'>
						{/* Step 1: Sign In */}
						{!user && (
							<div className='rounded-lg border-2 border-stone-800 bg-stone-50 p-4'>
								<p className='text-sm font-medium text-stone-900 mb-3'>
									Sign in to continue
								</p>
								{isSigningIn ? (
									<div className='flex items-center justify-center py-3'>
										<div className='w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin' />
										<span className='ml-3 text-sm text-stone-600'>Signing in...</span>
									</div>
								) : (
									<div className='flex justify-center'>
										<GoogleLogin
											onSuccess={handleGoogleSuccess}
											onError={handleGoogleError}
											theme="outline"
											size="large"
											text="continue_with"
											shape="rectangular"
										/>
									</div>
								)}
							</div>
						)}

						{/* Step 2: Address Selection */}
						{user && (
							<div className={`rounded-lg p-4 ${addresses && addresses.length > 0 ? 'border border-stone-200 bg-white' : 'border-2 border-stone-800 bg-stone-50'}`}>
								<p className='text-sm font-medium text-stone-900 mb-3'>Delivery Address</p>
								{addresses && addresses.length > 0 ? (
									<div className='relative address-dropdown-container'>
										<button
											onClick={() => setShowAddressDropdown(!showAddressDropdown)}
											className='w-full text-left rounded-lg border border-stone-300 bg-white p-3 hover:bg-stone-50 transition-colors'
										>
											<div className='flex items-start gap-3'>
												<MapPin className='text-stone-600 mt-0.5 flex-shrink-0' size={18} />
												<div className='flex-1 min-w-0'>
													<p className='font-medium text-stone-900 text-sm'>
														{addresses[selectedAddressIndex]?.name} • {addresses[selectedAddressIndex]?.phoneNumber}
													</p>
													<p className='text-xs text-stone-600 mt-0.5'>
														{addresses[selectedAddressIndex]?.houseNumber}, {addresses[selectedAddressIndex]?.streetAddress}, {addresses[selectedAddressIndex]?.city}
													</p>
												</div>
												<ChevronDown className={`text-stone-500 flex-shrink-0 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} size={18} />
											</div>
										</button>

										{showAddressDropdown && (
											<div className='absolute z-10 w-full mt-2 bg-white border border-stone-300 rounded-lg shadow-lg flex flex-col max-h-64 address-dropdown-container'>
												<div className='overflow-y-auto flex-1'>
													{addresses.map((addr, index) => (
														<button
															key={addr._id || index}
															onClick={() => {
																setSelectedAddressIndex(index);
																setShowAddressDropdown(false);
															}}
															className={`w-full text-left p-3 hover:bg-stone-50 transition-colors border-b border-stone-200 ${
																selectedAddressIndex === index ? 'bg-stone-100' : ''
															}`}
														>
															<div className='flex items-start gap-3'>
																<MapPin className='text-stone-600 mt-0.5 flex-shrink-0' size={16} />
																<div className='flex-1 min-w-0'>
																	<p className='font-medium text-stone-900 text-sm'>
																		{addr.name} • {addr.phoneNumber}
																	</p>
																	<p className='text-xs text-stone-600 mt-0.5'>
																		{addr.houseNumber}, {addr.streetAddress}, {addr.city}
																	</p>
																</div>
																{selectedAddressIndex === index && (
																	<div className='h-4 w-4 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0'>
																		<Check className='h-2.5 w-2.5 text-white' />
																	</div>
																)}
															</div>
														</button>
													))}
												</div>
												<button
													onClick={() => {
														setShowAddressForm(true);
														setShowAddressDropdown(false);
													}}
													className='w-full flex items-center justify-center gap-2 p-3 text-sm text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-200 flex-shrink-0'
												>
													<Plus size={16} />
													Add New Address
												</button>
											</div>
										)}
									</div>
								) : (
									<button
										onClick={() => setShowAddressForm(true)}
										className='w-full flex items-center justify-center gap-2 rounded-lg bg-stone-800 text-white px-4 py-3 text-sm font-medium hover:bg-stone-700 transition-colors'
									>
										<Plus size={18} />
										Add Delivery Address
									</button>
								)}
							</div>
						)}

						{/* Product Details */}
						<div className='pt-2'>
							<p className='text-sm font-medium text-stone-700 mb-2'>Your order</p>
							<div className='flex items-center gap-3 py-3 border-b border-stone-100'>
								<img 
									src={orderData.product.image} 
									alt={orderData.product.name}
									className='w-14 h-14 rounded-md object-cover'
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-sm text-stone-800 font-medium truncate'>{orderData.product.name}</p>
									<p className='text-xs text-stone-500 mt-0.5'>Qty: {orderData.quantity}</p>
								</div>
								<div className='text-right'>
									{orderData.product.actualPrice && orderData.product.actualPrice > orderData.product.price && (
										<p className='text-xs text-stone-400 line-through'>₹{(orderData.product.actualPrice * orderData.quantity).toFixed(2)}</p>
									)}
									<p className='text-sm font-semibold text-stone-900'>₹{totalPrice}</p>
								</div>
							</div>
						</div>

						{/* Pricing Summary */}
						<div className='space-y-2 pt-2'>
							<dl className='flex items-center justify-between'>
								<dt className='text-sm text-stone-600'>Subtotal</dt>
								<dd className='text-sm font-medium text-stone-900'>₹{totalPrice}</dd>
							</dl>

							{loadingPricing ? (
								<dl className='flex items-center justify-between'>
									<dt className='text-sm text-stone-500'>Calculating...</dt>
									<dd className='text-sm text-stone-500'>...</dd>
								</dl>
							) : pricingBreakdown ? (
								<>
									<dl className='flex items-center justify-between'>
										<dt className='text-sm text-stone-600'>Delivery</dt>
										<dd className='text-sm font-medium text-stone-900'>₹{pricingBreakdown.deliveryCharge.toFixed(2)}</dd>
									</dl>
									<dl className='flex items-center justify-between'>
										<dt className='text-sm text-stone-600'>Platform Fee</dt>
										<dd className='text-sm font-medium text-stone-900'>₹{pricingBreakdown.platformFee.total.toFixed(2)}</dd>
									</dl>
								</>
							) : null}

							<dl className='flex items-center justify-between pt-3 border-t border-stone-200'>
								<dt className='text-base font-bold text-stone-900'>Total</dt>
								<dd className='text-base font-bold text-stone-900'>₹{finalTotal}</dd>
							</dl>
						</div>

						{/* Pay Button - Always enabled, will prompt for login/address if needed */}
						<motion.button
							className={`flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-medium transition-colors ${
								isProcessing
									? 'bg-stone-400 text-white cursor-not-allowed'
									: 'bg-stone-800 text-white hover:bg-stone-700'
							}`}
							whileHover={{ scale: !isProcessing ? 1.02 : 1 }}
							whileTap={{ scale: !isProcessing ? 0.98 : 1 }}
							onClick={handlePlaceOrder}
							disabled={isProcessing}
						>
							<ShoppingBag size={16} className="mr-2" />
							{isProcessing ? "Processing..." : "Pay Now"}
						</motion.button>
					</div>
				</motion.div>
			</div>

			<LoginPromptModal
				isOpen={showLoginPrompt}
				onClose={() => setShowLoginPrompt(false)}
				onSuccess={handleGoogleSuccess}
				onError={handleGoogleError}
				isLoading={isSigningIn}
				title="Sign in to continue"
				description="Please sign in with your Google account to complete your order."
			/>

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
