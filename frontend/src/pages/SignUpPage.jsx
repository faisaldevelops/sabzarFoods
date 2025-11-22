import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, KeyRound, User, ArrowRight, Loader } from "lucide-react";
import { motion } from "framer-motion";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const SignUpPage = () => {
	const [step, setStep] = useState("phone"); // "phone" or "otp"
	const [phoneNumber, setPhoneNumber] = useState("");
	const [otp, setOtp] = useState("");
	const [name, setName] = useState("");
	const [loading, setLoading] = useState(false);
	const { checkAuth } = useUserStore();

	const handleSendOTP = async (e) => {
		e.preventDefault();
		
		if (!/^\d{10}$/.test(phoneNumber)) {
			toast.error("Please enter a valid 10-digit phone number");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/send", { phoneNumber, isSignup: true });
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

		if (!name.trim()) {
			toast.error("Please enter your name");
			return;
		}

		setLoading(true);
		try {
			const response = await axios.post("/otp/verify", {
				phoneNumber,
				otp,
				name: name.trim(),
			});
			
			toast.success(response.data.message);
			
			// Refresh auth state
			await checkAuth();
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to verify OTP");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
			<motion.div
				className='sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
			>
				<h2 className='mt-6 text-center text-3xl font-extrabold text-emerald-400'>
					{step === "phone" ? "Create your account" : "Verify OTP"}
				</h2>
			</motion.div>

			<motion.div
				className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<div className='bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10'>
					{step === "phone" ? (
						<form onSubmit={handleSendOTP} className='space-y-6'>
							<div>
								<label htmlFor='phoneNumber' className='block text-sm font-medium text-gray-300'>
									Phone Number
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<Phone className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='phoneNumber'
										type='tel'
										required
										value={phoneNumber}
										onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
										rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
										focus:border-emerald-500 sm:text-sm'
										placeholder='Enter 10-digit mobile number'
									/>
								</div>
								<p className='mt-1 text-xs text-gray-400'>
									We'll send you a verification code
								</p>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent 
								rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
								hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
								focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
								disabled={loading}
							>
								{loading ? (
									<>
										<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
										Sending...
									</>
								) : (
									<>
										<Phone className='mr-2 h-5 w-5' aria-hidden='true' />
										Send OTP
									</>
								)}
							</button>
						</form>
					) : (
						<form onSubmit={handleVerifyOTP} className='space-y-6'>
							<div>
								<label htmlFor='name' className='block text-sm font-medium text-gray-300'>
									Full Name
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<User className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='name'
										type='text'
										required
										value={name}
										onChange={(e) => setName(e.target.value)}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
										rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
										focus:border-emerald-500 sm:text-sm'
										placeholder='John Doe'
									/>
								</div>
							</div>

							<div>
								<label htmlFor='otp' className='block text-sm font-medium text-gray-300'>
									Enter OTP sent to +91{phoneNumber}
								</label>
								<div className='mt-1 relative rounded-md shadow-sm'>
									<div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
										<KeyRound className='h-5 w-5 text-gray-400' aria-hidden='true' />
									</div>
									<input
										id='otp'
										type='text'
										required
										value={otp}
										onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
										className='block w-full px-3 py-2 pl-10 bg-gray-700 border border-gray-600 
										rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-emerald-500 
										focus:border-emerald-500 sm:text-sm text-center text-2xl tracking-widest'
										placeholder='Enter 6-digit OTP'
										maxLength={6}
									/>
								</div>
							</div>

							<button
								type='submit'
								className='w-full flex justify-center py-2 px-4 border border-transparent 
								rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600
								hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2
								focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50'
								disabled={loading}
							>
								{loading ? (
									<>
										<Loader className='mr-2 h-5 w-5 animate-spin' aria-hidden='true' />
										Verifying...
									</>
								) : (
									<>
										<KeyRound className='mr-2 h-5 w-5' aria-hidden='true' />
										Verify & Sign Up
									</>
								)}
							</button>

							<button
								type="button"
								onClick={() => {
									setStep("phone");
									setOtp("");
								}}
								className="w-full text-sm text-emerald-400 hover:text-emerald-300"
								disabled={loading}
							>
								Change phone number
							</button>
						</form>
					)}

					<p className='mt-8 text-center text-sm text-gray-400'>
						Already have an account?{" "}
						<Link to='/login' className='font-medium text-emerald-400 hover:text-emerald-300'>
							Login here <ArrowRight className='inline h-4 w-4' />
						</Link>
					</p>
				</div>
			</motion.div>
		</div>
	);
};
export default SignUpPage;
