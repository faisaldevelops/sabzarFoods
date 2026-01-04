import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";
import { useUserStore } from "../stores/useUserStore";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const LoginPage = () => {
	const [loading, setLoading] = useState(false);
	const { checkAuth } = useUserStore();
	const { syncGuestCart } = useCartStore();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const handleGoogleSuccess = async (credentialResponse) => {
		setLoading(true);
		try {
			await axios.post("/auth/google", {
				credential: credentialResponse.credential,
			});

			await checkAuth();
			await syncGuestCart();

			toast.success("Welcome!");

			// Redirect to specified page or home
			const redirect = searchParams.get("redirect") || "/";
			navigate(redirect);
		} catch (error) {
			console.error("Login failed:", error);
			toast.error(error.response?.data?.message || "Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleError = () => {
		toast.error("Google sign-in failed. Please try again.");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50 px-4 py-12">
			{/* Background decorative elements */}
			<div className="absolute inset-0 overflow-hidden pointer-events-none">
				<div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100 rounded-full opacity-40 blur-3xl" />
				<div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100 rounded-full opacity-40 blur-3xl" />
			</div>

			<motion.div
				className="relative w-full max-w-md"
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
			>
				{/* Main card */}
				<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
					{/* Header section with brand */}
					<div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-10 text-center">
						<motion.div
							initial={{ opacity: 0, y: -10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.2, duration: 0.4 }}
						>
							<div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
								<span className="text-3xl">🍽️</span>
							</div>
							<h1 className="text-2xl font-bold text-white mb-2">
								SabzarFood
							</h1>
							<p className="text-emerald-100 text-sm">
								Fresh & Delicious, Delivered to You
							</p>
						</motion.div>
					</div>

					{/* Login section */}
					<div className="px-8 py-10">
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3, duration: 0.4 }}
							className="text-center mb-8"
						>
							<h2 className="text-xl font-semibold text-gray-800 mb-2">
								Welcome Back
							</h2>
							<p className="text-gray-500 text-sm">
								Sign in to access your account and orders
							</p>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.4, duration: 0.4 }}
							className="space-y-6"
						>
							{/* Google Login Container */}
							<div className="flex flex-col items-center">
								{loading ? (
									<div className="flex items-center justify-center py-4 px-8 bg-gray-50 rounded-lg w-full">
										<div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
										<span className="ml-3 text-sm text-gray-600">Signing you in...</span>
									</div>
								) : (
									<div className="w-full flex justify-center">
										<GoogleLogin
											onSuccess={handleGoogleSuccess}
											onError={handleGoogleError}
											theme="outline"
											size="large"
											text="continue_with"
											shape="rectangular"
											width="300"
											logo_alignment="center"
										/>
									</div>
								)}
							</div>

							{/* Divider */}
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200"></div>
								</div>
								<div className="relative flex justify-center text-xs">
									<span className="px-4 bg-white text-gray-400">
										Secure sign-in with Google
									</span>
								</div>
							</div>

							{/* Trust badges */}
							<div className="flex items-center justify-center gap-6 text-gray-400 pt-2">
								<div className="flex items-center gap-1.5 text-xs">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
									</svg>
									<span>Secure</span>
								</div>
								<div className="flex items-center gap-1.5 text-xs">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
									</svg>
									<span>Protected</span>
								</div>
								<div className="flex items-center gap-1.5 text-xs">
									<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
									</svg>
									<span>Fast</span>
								</div>
							</div>
						</motion.div>
					</div>
				</div>

				{/* Footer text */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ delay: 0.6, duration: 0.4 }}
					className="text-center text-xs text-gray-400 mt-6"
				>
					By continuing, you agree to our Terms of Service and Privacy Policy
				</motion.p>
			</motion.div>
		</div>
	);
};

export default LoginPage;
