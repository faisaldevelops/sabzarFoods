import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight, MapPin, Plus, ChevronDown, Check } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import AddressModal from "./AddressModal";
import InsufficientStockModal from "./InsufficientStockModal";
import CountdownTimer from "./CountdownTimer";
import { SHOP_CONFIG } from "../config/constants";

const OrderSummary = () => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [isSigningIn, setIsSigningIn] = useState(false);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [showAddressDropdown, setShowAddressDropdown] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null);
	const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
	const { total, subtotal, cart, updateQuantity, clearCart, syncGuestCart } = useCartStore();
	const { user, checkAuth } = useUserStore();
	const { address: addresses, fetchAddresses, createAddress, loading: addressLoading } = useAddressStore();
	const navigate = useNavigate();

	const [pricingBreakdown, setPricingBreakdown] = useState(null);
	const [loadingPricing, setLoadingPricing] = useState(false);

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedSavings = savings.toFixed(2);
	
	const formattedTotal = pricingBreakdown 
		? pricingBreakdown.total.toFixed(2)
		: total.toFixed(2);

	// Fetch addresses when user is logged in
	useEffect(() => {
		if (user) {
			fetchAddresses();
		}
	}, [user, fetchAddresses]);

	// Fetch pricing breakdown when address is selected
	useEffect(() => {
		const fetchPricing = async () => {
			if (!addresses || addresses.length === 0 || !subtotal) {
				setPricingBreakdown(null);
				return;
			}

			const selectedAddress = addresses[selectedAddressIndex];
			if (!selectedAddress) {
				setPricingBreakdown(null);
				return;
			}

			setLoadingPricing(true);
			try {
				const res = await axios.post("/payments/calculate-pricing", {
					subtotal: total,
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
	}, [addresses, selectedAddressIndex, total]);

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

	// Handle Google sign-in success - inline flow
	const handleGoogleSuccess = async (credentialResponse) => {
		setIsSigningIn(true);
		try {
			await axios.post("/auth/google", {
				credential: credentialResponse.credential,
			});
			await checkAuth();
			await syncGuestCart();
			await fetchAddresses();
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

	// Handle place order button click
	const handlePlaceOrder = () => {
		if (!addresses || addresses.length === 0) {
			toast.error("Please add a delivery address");
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
		if (!cart || cart.length === 0) return toast.error("Cart empty");

		setIsProcessing(true);
		try {
			const res = await axios.post("/payments/razorpay-create-order", {
				products: cart,
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
							clearCart();
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
			theme: {
				color: "#10B981",
			},
			config: {
				display: {
					blocks: {
						payments: {
							name: "Payment Methods",
							instruments: [
								{ method: "upi" },
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

	const handleReduceQuantity = async (items) => {
		await Promise.all(
			items.map(item => {
				if (item.available > 0 && item.productId) {
					return updateQuantity(item.productId.toString(), item.available);
				} else if (item.available === 0 && item.productId) {
					return updateQuantity(item.productId.toString(), 0);
				}
				return Promise.resolve();
			})
		);
		setShowInsufficientStock(false);
		toast.success("Cart updated with available quantities");
	};

	const handleBrowseSimilar = () => {
		setShowInsufficientStock(false);
		navigate("/");
	};

	const handleJoinWaitlist = () => {
		toast.success("You'll be notified when items are back in stock");
		setShowInsufficientStock(false);
	};

	const handleHoldExpire = () => {
		toast.error("Your checkout session has expired. Please try again.");
		setHoldInfo(null);
		setIsProcessing(false);
	};

	// Calculate current step for progress indicator
	const currentStep = !user ? 1 : (!addresses || addresses.length === 0) ? 2 : 3;

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-stone-900'>Checkout</p>

			{/* Progress Steps */}
			<div className='flex items-center gap-2 pb-4 border-b border-stone-200'>
				{/* Step 1: Sign In */}
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
				{/* Step 2: Address */}
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
				{/* Step 3: Pay */}
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

			{/* Countdown Timer when hold is active */}
			{holdInfo && (
				<CountdownTimer 
					expiresAt={holdInfo.expiresAt}
					durationSeconds={holdInfo.holdDurationSeconds}
					onExpire={handleHoldExpire}
				/>
			)}

			<div className='space-y-4'>
				{/* Step 1: Sign In - Inline */}
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

				{/* Step 2: Address Selection - Shows when signed in */}
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

				{/* Order Items */}
				<div className='space-y-2 pt-2'>
					<p className='text-sm font-medium text-stone-700'>Your order</p>
					{cart.map((item) => (
						<div key={item._id} className='flex items-center justify-between gap-3 py-2 border-b border-stone-100'>
							<div className='flex items-center gap-2 flex-1'>
								<img 
									src={item.image} 
									alt={item.name}
									className='w-10 h-10 rounded object-cover flex-shrink-0'
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-xs text-stone-800 truncate'>{item.name}</p>
									<p className='text-xs text-stone-500'>×{item.quantity}</p>
								</div>
							</div>
							<div className='flex flex-col items-end flex-shrink-0'>
								{item.actualPrice && item.actualPrice > item.price && (
									<span className='text-xs text-stone-400 line-through'>₹{(item.actualPrice * item.quantity).toFixed(2)}</span>
								)}
								<span className='text-sm font-medium text-stone-900'>₹{(item.price * item.quantity).toFixed(2)}</span>
							</div>
						</div>
					))}
				</div>

				{/* Pricing Summary */}
				<div className='space-y-2 pt-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-sm text-stone-600'>Subtotal</dt>
						<dd className='text-sm font-medium text-stone-900'>₹{formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-sm text-stone-600'>Savings</dt>
							<dd className='text-sm font-medium text-green-600'>-₹{formattedSavings}</dd>
						</dl>
					)}

					{loadingPricing ? (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-sm text-stone-500'>Calculating...</dt>
							<dd className='text-sm text-stone-500'>...</dd>
						</dl>
					) : pricingBreakdown ? (
						<>
							<dl className='flex items-center justify-between gap-4'>
								<dt className='text-sm text-stone-600'>Delivery</dt>
								<dd className='text-sm font-medium text-stone-900'>₹{pricingBreakdown.deliveryCharge.toFixed(2)}</dd>
							</dl>
							<dl className='flex items-center justify-between gap-4'>
								<dt className='text-sm text-stone-600'>Platform Fee</dt>
								<dd className='text-sm font-medium text-stone-900'>₹{pricingBreakdown.platformFee.total.toFixed(2)}</dd>
							</dl>
						</>
					) : null}

					<dl className='flex items-center justify-between gap-4 border-t border-stone-200 pt-3'>
						<dt className='text-base font-bold text-stone-900'>Total</dt>
						<dd className='text-base font-bold text-stone-900'>₹{formattedTotal}</dd>
					</dl>
				</div>

				{/* Pay Button - Only enabled when signed in and has address */}
				<motion.button
					className={`flex w-full items-center justify-center rounded-lg px-5 py-3 text-sm font-medium transition-colors ${
						user && addresses && addresses.length > 0
							? 'bg-stone-800 text-white hover:bg-stone-700'
							: 'bg-stone-200 text-stone-400 cursor-not-allowed'
					}`}
					whileHover={{ scale: user && addresses?.length > 0 && !isProcessing ? 1.02 : 1 }}
					whileTap={{ scale: user && addresses?.length > 0 && !isProcessing ? 0.98 : 1 }}
					onClick={handlePlaceOrder}
					disabled={isProcessing || !user || !addresses || addresses.length === 0}
				>
					{isProcessing ? "Processing..." : "Pay Now"}
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<Link
						to='/'
						className='inline-flex items-center gap-1 text-sm text-stone-600 hover:text-stone-800'
					>
						← Continue Shopping
					</Link>
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
		</motion.div>
	);
};

export default OrderSummary;
