import { useState } from "react";
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
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to send OTP");
		} finally {
			setLoading(false);
		}
	};

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
		<div className='min-h-screen flex flex-col justify-center py-12 px-4 bg-black'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<h2 className='text-3xl font-semibold text-white mb-2 tracking-tight'>
					{step === "phone" ? "Login" : "Verify Code"}
				</h2>
				<p className='text-sm text-neutral-400'>
					{step === "phone" ? "Enter your phone number to continue" : `Code sent to +91${phoneNumber}`}
				</p>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<div className='bg-neutral-900 py-8 px-6 border border-neutral-800'>
					{step === "phone" ? (
						<form onSubmit={handleSendOTP} className='space-y-6'>
							<div>
								<label htmlFor='phoneNumber' className='block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide'>
									Phone Number
								</label>
								<input
									id='phoneNumber'
									type='tel'
									required
									value={phoneNumber}
									onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
									className='block w-full px-4 py-3 bg-black border border-neutral-800 
									text-white placeholder-neutral-600 focus:outline-none focus:border-white 
									sm:text-sm transition-colors'
									placeholder='10-digit mobile number'
								/>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center items-center py-3 px-4 
								text-xs font-medium tracking-wide text-black bg-white
								hover:bg-neutral-200 focus:outline-none 
								transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase'
								disabled={loading}
							>
								{loading ? 'Sending...' : 'Send Code'}
							</button>
						</form>
					) : (
						<form onSubmit={handleVerifyOTP} className='space-y-6'>
							<div>
								<label htmlFor='otp' className='block text-xs font-medium text-neutral-400 mb-2 uppercase tracking-wide'>
									Verification Code
								</label>
								<input
									id='otp'
									type='text'
									required
									value={otp}
									onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
									className='block w-full px-4 py-3 bg-black border border-neutral-800 
									text-white placeholder-neutral-600 focus:outline-none focus:border-white 
									sm:text-sm text-center text-lg tracking-widest transition-colors'
									placeholder='000000'
									maxLength={6}
								/>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center items-center py-3 px-4 
								text-xs font-medium tracking-wide text-black bg-white
								hover:bg-neutral-200 focus:outline-none 
								transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase'
								disabled={loading}
							>
								{loading ? 'Verifying...' : 'Verify & Login'}
							</button>

							<button
								type="button"
								onClick={() => {
									setStep("phone");
									setOtp("");
								}}
								className="w-full text-xs text-neutral-400 hover:text-white transition-colors py-2"
								disabled={loading}
							>
								← Change phone number
							</button>
						</form>
					)}

					<div className='mt-6 text-center'>
						<p className='text-xs text-neutral-400'>
							Don't have an account?{" "}
							<Link to='/signup' className='text-white hover:underline'>
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
