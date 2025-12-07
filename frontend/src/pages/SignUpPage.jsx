import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";

const SignUpPage = () => {
	const [step, setStep] = useState("phone"); // "phone" or "otp"
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otp, setOtp] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const [resendLoading, setResendLoading] = useState(false);
	const [phoneError, setPhoneError] = useState("");
	const [otpError, setOtpError] = useState("");
	const [otpSuccess, setOtpSuccess] = useState("");
	const [nameError, setNameError] = useState("");
	const { checkAuth } = useUserStore();
	const { syncGuestCart } = useCartStore();

	const handleSendOTP = async (e) => {
		e.preventDefault();
		setPhoneError("");
		
		if (!/^\d{10}$/.test(phoneNumber)) {
			setPhoneError("Please enter a valid 10-digit phone number");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/send", { phoneNumber, isSignup: true });
			setOtpSuccess("OTP sent successfully");
			
			// In development, show OTP in toast
			if (response.data.otp) {
				toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
			}
			
			setStep("otp");
			setResendCooldown(60); // Start 60-second cooldown
			
			// Clear success message after 3 seconds
			setTimeout(() => setOtpSuccess(""), 3000);
		} catch (error) {
			const errorData = error.response?.data;
			if (errorData?.reason === "frozen") {
				setPhoneError(errorData.message);
			} else {
				setPhoneError(errorData?.message || "Failed to send OTP");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleResendOTP = async () => {
		if (resendCooldown > 0) {
			return;
		}

		setResendLoading(true);
		setOtpError("");
		setOtpSuccess("");
		try {
			const response = await axios.post("/otp/resend", { phoneNumber });
			setOtpSuccess("OTP resent successfully");
			
			// In development, show OTP in toast
			if (response.data.otp) {
				toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
			}
			
			setResendCooldown(60); // Reset 60-second cooldown
			
			// Clear success message after 3 seconds
			setTimeout(() => setOtpSuccess(""), 3000);
		} catch (error) {
			const errorData = error.response?.data;
			if (errorData?.reason === "cooldown" && errorData?.waitTime) {
				setOtpError(`Please wait ${errorData.waitTime} seconds before resending`);
			} else if (errorData?.reason === "limit_reached" && errorData?.resetInMinutes) {
				setOtpError(`Too many attempts. Try again in ${errorData.resetInMinutes} minute(s)`);
			} else {
				setOtpError(errorData?.message || "Failed to resend OTP");
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
		setOtpError("");
		setOtpSuccess("");
		setNameError("");
		
		if (!otp || otp.length !== 6) {
			setOtpError("Please enter the 6-digit OTP");
			return;
		}

		if (!name.trim()) {
			setNameError("Please enter your name");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/verify", {
				phoneNumber,
				otp,
				name: name.trim(),
			});
			
			setOtpSuccess(response.data.message);
			
			// Refresh auth state
			await checkAuth();
			
			// Sync guest cart to database after successful signup
			await syncGuestCart();
		} catch (error) {
			const errorData = error.response?.data;
			if (errorData?.reason === "frozen") {
				setOtpError(errorData.message);
			} else if (errorData?.remainingAttempts !== undefined) {
				setOtpError(`Invalid OTP. ${errorData.remainingAttempts} attempt(s) remaining`);
			} else {
				setOtpError(errorData?.message || "Failed to verify OTP");
			}
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
					{step === "phone" ? "Create Account" : "Verify Code"}
				</h2>
				<p className='text-sm text-stone-600 font-light'>
					{step === "phone" ? "Enter your phone number to get started" : `Code sent to +91${phoneNumber}`}
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
									onChange={(e) => {
										setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
										setPhoneError("");
									}}
									className={`block w-full px-4 py-3 bg-white border rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent
									sm:text-sm transition-all ${phoneError ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-stone-800'}`}
									placeholder='10-digit mobile number'
								/>
								{phoneError && (
									<p className='mt-2 text-sm text-red-600'>{phoneError}</p>
								)}
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
								<label htmlFor='name' className='block text-sm font-medium text-stone-700 mb-2'>
									Full Name
								</label>
								<input
									id='name'
									type='text'
									required
									value={name}
									onChange={(e) => {
										setName(e.target.value);
										setNameError("");
									}}
									className={`block w-full px-4 py-3 bg-white border rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent
									sm:text-sm transition-all ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-stone-300 focus:ring-stone-800'}`}
									placeholder='John Doe'
								/>
								{nameError && (
									<p className='mt-2 text-sm text-red-600'>{nameError}</p>
								)}
							</div>

							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-stone-700 mb-2'>
									Verification Code
								</label>
								<input
									id='otp'
									type='text'
									required
									value={otp}
									onChange={(e) => {
										setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
										setOtpError("");
										setOtpSuccess("");
									}}
									className={`block w-full px-4 py-3 bg-white border rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent
									sm:text-sm text-center text-lg font-mono tracking-widest transition-all ${otpError ? 'border-red-500 focus:ring-red-500' : otpSuccess ? 'border-green-500 focus:ring-green-500' : 'border-stone-300 focus:ring-stone-800'}`}
									placeholder='000000'
									maxLength={6}
								/>
								{otpError && (
									<p className='mt-2 text-sm text-red-600'>{otpError}</p>
								)}
								{otpSuccess && (
									<p className='mt-2 text-sm text-green-600'>{otpSuccess}</p>
								)}
							</div>

							<button
								type='submit'
								className='w-full flex justify-center items-center py-3 px-4 rounded-md
								text-sm font-medium text-white bg-stone-800
								hover:bg-stone-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800
								transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
								disabled={loading}
							>
								{loading ? 'Verifying...' : 'Verify & Create Account'}
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
							Already have an account?{" "}
							<Link to='/login' className='text-stone-900 font-medium hover:underline'>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</motion.div>
		</div>
	);
};
export default SignUpPage;
