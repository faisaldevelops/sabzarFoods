import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight, MapPin, Plus, ChevronDown } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import PhoneAuthModal from "./PhoneAuthModal";
import AddressModal from "./AddressModal";
import InsufficientStockModal from "./InsufficientStockModal";
import CountdownTimer from "./CountdownTimer";
import { SHOP_CONFIG } from "../config/constants";

const OrderSummary = () => {
	const [isProcessing, setIsProcessing] = useState(false);
	const [showPhoneAuth, setShowPhoneAuth] = useState(false);
	const [showAddressForm, setShowAddressForm] = useState(false);
	const [showAddressDropdown, setShowAddressDropdown] = useState(false);
	const [showInsufficientStock, setShowInsufficientStock] = useState(false);
	const [insufficientItems, setInsufficientItems] = useState([]);
	const [holdInfo, setHoldInfo] = useState(null); // { expiresAt, localOrderId }
	const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
	const { total, subtotal, cart, updateQuantity, clearCart } = useCartStore();
	const { user } = useUserStore();
	const { address: addresses, fetchAddresses, createAddress, loading: addressLoading } = useAddressStore();
	const navigate = useNavigate();

	const [pricingBreakdown, setPricingBreakdown] = useState(null);
	const [loadingPricing, setLoadingPricing] = useState(false);

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedSavings = savings.toFixed(2);
	
	// Calculate total with pricing breakdown if available
	// Only show full total (with delivery + platform fee) when pricing breakdown is available
	// Otherwise just show cart total without extra charges
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
				// Use discounted subtotal (total) for platform fee calculation
				// Platform fee should be calculated on the amount actually being charged
				const res = await axios.post("/payments/calculate-pricing", {
					subtotal: total, // Use cart total (after discounts) for fee calculation
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

	// Handle place order button click
	const handlePlaceOrder = () => {
		// Check if user is authenticated
		if (!user) {
			// Show phone auth modal
			setShowPhoneAuth(true);
			return;
		}

		// Check if address is selected
		if (!addresses || addresses.length === 0) {
			toast.error("Please add a delivery address");
			return;
		}

		// Proceed to payment with selected address
		const selectedAddress = addresses[selectedAddressIndex];
		handlePayment(selectedAddress);
	};

	const handleAuthSuccess = async () => {
		// Close phone auth modal
		setShowPhoneAuth(false);
		// Addresses will be fetched automatically via useEffect
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
							clearCart(); // Clear cart on successful payment
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
			className='space-y-4 rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-stone-900'>Order summary</p>

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
						<p className='text-sm font-semibold text-stone-700'>Delivery Address</p>
						{addresses && addresses.length > 0 ? (
							<div className='relative address-dropdown-container'>
								<button
									onClick={() => setShowAddressDropdown(!showAddressDropdown)}
									className='w-full text-left rounded-lg border border-stone-300 bg-stone-50 p-4 hover:bg-stone-100 transition-colors'
								>
									<div className='flex items-start gap-3'>
										<MapPin className='text-stone-600 mt-1 flex-shrink-0' size={20} />
										<div className='flex-1 min-w-0'>
											<p className='font-medium text-stone-900'>
												{addresses[selectedAddressIndex]?.name} • {addresses[selectedAddressIndex]?.phoneNumber}
											</p>
											{addresses[selectedAddressIndex]?.email && (
												<p className='text-sm text-stone-600'>{addresses[selectedAddressIndex]?.email}</p>
											)}
											<p className='text-sm text-stone-700 mt-1'>
												{addresses[selectedAddressIndex]?.houseNumber}, {addresses[selectedAddressIndex]?.streetAddress}
												{addresses[selectedAddressIndex]?.landmark && `, ${addresses[selectedAddressIndex]?.landmark}`}
											</p>
											<p className='text-sm text-stone-700'>
												{addresses[selectedAddressIndex]?.city}, {addresses[selectedAddressIndex]?.state} - {addresses[selectedAddressIndex]?.pincode}
											</p>
										</div>
										<ChevronDown className={`text-stone-600 flex-shrink-0 transition-transform ${showAddressDropdown ? 'rotate-180' : ''}`} size={20} />
									</div>
								</button>

								{/* Address Dropdown */}
								{showAddressDropdown && (
									<div className='absolute z-10 w-full mt-2 bg-white border border-stone-300 rounded-lg shadow-lg flex flex-col max-h-64 address-dropdown-container'>
										{/* Scrollable address list */}
										<div className='overflow-y-auto flex-1'>
											{addresses.map((addr, index) => (
												<button
													key={addr._id || index}
													onClick={() => {
														setSelectedAddressIndex(index);
														setShowAddressDropdown(false);
													}}
													className={`w-full text-left p-4 hover:bg-stone-50 transition-colors border-b border-stone-200 ${
														selectedAddressIndex === index ? 'bg-stone-100' : ''
													}`}
												>
													<div className='flex items-start gap-3'>
														<MapPin className='text-stone-600 mt-1 flex-shrink-0' size={18} />
														<div className='flex-1 min-w-0'>
															<p className='font-medium text-stone-900'>
																{addr.name} • {addr.phoneNumber}
															</p>
															{addr.email && <p className='text-sm text-stone-600'>{addr.email}</p>}
															<p className='text-sm text-stone-700 mt-1'>
																{addr.houseNumber}, {addr.streetAddress}
																{addr.landmark && `, ${addr.landmark}`}
															</p>
															<p className='text-sm text-stone-700'>
																{addr.city}, {addr.state} - {addr.pincode}
															</p>
														</div>
														{selectedAddressIndex === index && (
															<div className='h-5 w-5 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0'>
																<svg className='h-3 w-3 text-white' fill='currentColor' viewBox='0 0 20 20'>
																	<path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
																</svg>
															</div>
														)}
													</div>
												</button>
											))}
										</div>
										{/* Always visible Add New Address button */}
										<button
											onClick={() => {
												setShowAddressForm(true);
												setShowAddressDropdown(false);
											}}
											className='w-full flex items-center justify-center gap-2 p-4 text-stone-700 hover:bg-stone-50 transition-colors border-t border-stone-200 flex-shrink-0'
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
								className='w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors'
							>
								<Plus size={20} />
								Add Delivery Address
							</button>
						)}
					</div>
				)}

				{/* Item Breakdown */}
				<div className='space-y-2'>
					<p className='text-sm font-semibold text-stone-700'>Items in your order:</p>
					{cart.map((item) => (
						<div key={item._id} className='flex items-center justify-between gap-3 pb-2 border-b border-stone-200'>
							<div className='flex items-center gap-2 flex-1'>
								<img 
									src={item.image} 
									alt={item.name}
									className='w-10 h-10 rounded object-cover flex-shrink-0'
								/>
								<div className='flex-1 min-w-0'>
									<p className='text-xs text-stone-700 truncate'>{item.name}</p>
									<p className='text-xs text-stone-500'>Qty: {item.quantity}</p>
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

				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-stone-700'>Original price</dt>
						<dd className='text-base font-medium text-stone-900'>₹{formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-stone-700'>Savings</dt>
							<dd className='text-base font-medium text-stone-900'>-₹{formattedSavings}</dd>
						</dl>
					)}
				{loadingPricing ? (
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-stone-700'>Calculating charges...</dt>
						<dd className='text-base font-medium text-stone-900'>...</dd>
					</dl>
				) : pricingBreakdown ? (
					<>
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-stone-700'>Delivery Charges</dt>
							<dd className='text-base font-medium text-stone-900'>₹{pricingBreakdown.deliveryCharge.toFixed(2)}</dd>
						</dl>
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-stone-700'>Platform Fee</dt>
							<dd className='text-base font-medium text-stone-900'>₹{pricingBreakdown.platformFee.total.toFixed(2)}</dd>
						</dl>
					</>
				) : null}
					<dl className='flex items-center justify-between gap-4 border-t border-stone-300 pt-2'>
						<dt className='text-base font-bold text-stone-900'>Total</dt>
						<dd className='text-base font-bold text-stone-900'>₹{formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-4 focus:ring-stone-300 disabled:opacity-50 disabled:cursor-not-allowed'
					whileHover={{ scale: isProcessing ? 1 : 1.05 }}
					whileTap={{ scale: isProcessing ? 1 : 0.95 }}
					onClick={handlePlaceOrder}
					disabled={isProcessing}
				>
					{isProcessing ? "Processing..." : "Buy"}
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-stone-600'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-stone-800 underline hover:text-stone-700 hover:no-underline'
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
