import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const LoginPage = () => {
	const [step, setStep] = useState("phone"); // "phone" or "otp"
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otp, setOtp] = useState("");
	const [loading, setLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [resendLoading, setResendLoading] = useState(false);
	const { checkAuth } = useUserStore();
	const { syncGuestCart } = useCartStore();

	const handleSendOTP = async (e) => {
		e.preventDefault();
		
		if (!/^\d{10}$/.test(phoneNumber)) {
			toast.error("Please enter a valid 10-digit phone number");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/send", { phoneNumber, isSignup: false });
			toast.success(response.data.message);
			
			// In development, show OTP in toast
			if (response.data.otp) {
				toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
			}
			
			setStep("otp");
			setResendCooldown(30); // Start 30-second cooldown
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send OTP");
		} finally {
			setLoading(false);
		}
	};

	const handleResendOTP = async () => {
		if (resendCooldown > 0) {
			return;
		}

		setResendLoading(true);
		try {
			const response = await axios.post("/otp/resend", { phoneNumber });
			toast.success(response.data.message);
			
			// In development, show OTP in toast
			if (response.data.otp) {
				toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
			}
			
			setResendCooldown(30); // Reset 30-second cooldown
		} catch (error) {
			const errorData = error.response?.data;
			if (errorData?.reason === "cooldown" && errorData?.waitTime) {
				toast.error(`Please wait ${errorData.waitTime} seconds before resending`);
			} else if (errorData?.reason === "limit_reached" && errorData?.resetInMinutes) {
				toast.error(`Too many attempts. Try again in ${errorData.resetInMinutes} minute(s)`);
			} else {
				toast.error(errorData?.message || "Failed to resend OTP");
			}
		} finally {
			setResendLoading(false);
		}
	};

	// Countdown timer effect
	useEffect(() => {
		if (resendCooldown > 0) {
			const timer = setTimeout(() => {
				setResendCooldown(resendCooldown - 1);
			}, 1000);
			return () => clearTimeout(timer);
		}
	}, [resendCooldown]);

	const handleVerifyOTP = async (e) => {
		e.preventDefault();
		
		if (!otp || otp.length !== 6) {
			toast.error("Please enter the 6-digit OTP");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/verify", {
				phoneNumber,
				otp,
			});
			
			toast.success(response.data.message);
			
			// Refresh auth state
			await checkAuth();
			
			// Sync guest cart to database after successful login
			await syncGuestCart();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to verify OTP");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='min-h-screen flex flex-col justify-center py-12 px-4 bg-stone-50'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<h2 className='text-3xl font-bold text-stone-900 mb-2 tracking-tight'>
					{step === "phone" ? "Login" : "Verify Code"}
				</h2>
				<p className='text-sm text-stone-600 font-light'>
					{step === "phone" ? "Enter your phone number to continue" : `Code sent to +91${phoneNumber}`}
				</p>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<div className='bg-white py-8 px-6 shadow-lg rounded-lg border border-stone-200'>
					{step === "phone" ? (
						<form onSubmit={handleSendOTP} className='space-y-6'>
							<div>
								<label htmlFor='phoneNumber' className='block text-sm font-medium text-stone-700 mb-2'>
									Phone Number
								</label>
								<input
									id='phoneNumber'
									type='tel'
									required
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
									className='block w-full px-4 py-3 bg-white border border-stone-300 rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent
									sm:text-sm transition-all'
									placeholder='10-digit mobile number'
								/>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center items-center py-3 px-4 rounded-md
								text-sm font-medium text-white bg-stone-800
								hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800
								transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
								disabled={loading}
							>
								{loading ? 'Sending...' : 'Send Code'}
							</button>
						</form>
					) : (
						<form onSubmit={handleVerifyOTP} className='space-y-6'>
							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-stone-700 mb-2'>
									Verification Code
								</label>
								<input
									id='otp'
									type='text'
									required
									value={otp}
									onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
									className='block w-full px-4 py-3 bg-white border border-stone-300 rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-800 focus:border-transparent
									sm:text-sm text-center text-lg font-mono tracking-widest transition-all'
									placeholder='000000'
									maxLength={6}
								/>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center items-center py-3 px-4 rounded-md
								text-sm font-medium text-white bg-stone-800
								hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800
								transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
								disabled={loading}
							>
								{loading ? 'Verifying...' : 'Verify & Login'}
							</button>

							<div className='flex items-center justify-between'>
								<button
									type="button"
									onClick={() => {
										setStep("phone");
										setOtp("");
										setResendCooldown(0);
									}}
									className="text-sm text-stone-600 hover:text-stone-900 transition-colors py-2 font-medium"
									disabled={loading || resendLoading}
								>
									← Change phone number
								</button>

								<button
									type="button"
									onClick={handleResendOTP}
									className="text-sm text-stone-800 hover:text-stone-900 transition-colors py-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
									disabled={loading || resendLoading || resendCooldown > 0}
								>
									{resendLoading ? (
										"Sending..."
									) : resendCooldown > 0 ? (
										`Resend in ${resendCooldown}s`
									) : (
										"Resend Code"
									)}
								</button>
							</div>
						</form>
					)}

					<div className='mt-6 text-center'>
						<p className='text-sm text-stone-600'>
							Don't have an account?{" "}
							<Link to='/signup' className='text-stone-900 font-medium hover:underline'>
								Sign up
							</Link>
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
};
export default LoginPage;
