import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
	const [phoneError, setPhoneError] = useState("");
	const [otpError, setOtpError] = useState("");
	const [otpSuccess, setOtpSuccess] = useState("");
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
			await axios.post("/otp/send", { phoneNumber });
			setOtpSuccess("OTP sent successfully");
			
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
			await axios.post("/otp/resend", { phoneNumber });
			setOtpSuccess("OTP resent successfully");
			
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
		
		if (!otp || otp.length !== 4) {
			setOtpError("Please enter the 4-digit OTP");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/verify", {
				phoneNumber,
				otp,
			});
			
			setOtpSuccess(response.data.message);
			
			// Refresh auth state
			await checkAuth();
			
			// Sync guest cart to database after successful login
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
					{step === "phone" ? "Login / Sign Up" : "Verify Code"}
				</h2>
				<p className='text-sm text-stone-600 font-light'>
					{step === "phone" ? "Enter your WhatsApp number to continue" : `Code sent to +91${phoneNumber} via WhatsApp`}
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
									WhatsApp Number
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
								className='w-full flex justify-center items-center gap-2 py-3 px-4 rounded-md
								text-sm font-medium text-white bg-[#25D366]
								hover:bg-[#20bd5a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#25D366]
								transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm'
								disabled={loading}
							>
								<svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
									<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
								</svg>
								{loading ? 'Sending...' : 'Send OTP via WhatsApp'}
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
									inputMode='numeric'
									pattern='[0-9]*'
									autoComplete='one-time-code'
									required
									value={otp}
									onChange={(e) => {
										setOtp(e.target.value.replace(/\D/g, "").slice(0, 4));
										setOtpError("");
										setOtpSuccess("");
									}}
									onPaste={(e) => {
										e.preventDefault();
										const pastedData = e.clipboardData.getData('text');
										const digits = pastedData.replace(/\D/g, "").slice(0, 4);
										setOtp(digits);
										setOtpError("");
										setOtpSuccess("");
									}}
									className={`block w-full px-4 py-3 bg-white border rounded-md
									text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:border-transparent
									sm:text-sm text-center text-lg font-mono tracking-widest transition-all ${otpError ? 'border-red-500 focus:ring-red-500' : otpSuccess ? 'border-green-500 focus:ring-green-500' : 'border-stone-300 focus:ring-stone-800'}`}
									placeholder='0000'
									maxLength={4}
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

				</div>
			</motion.div>
		</div>
	);
};
export default LoginPage;
