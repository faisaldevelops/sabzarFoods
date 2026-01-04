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
		<div className="min-h-screen flex flex-col justify-center py-12 px-4 bg-stone-50">
			<motion.div
				className="sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4 }}
			>
				<h2 className="text-2xl font-semibold text-stone-900 mb-2 tracking-tight text-center">
					Welcome
				</h2>
				<p className="text-sm text-stone-600 text-center">
					Sign in to continue
				</p>
			</motion.div>

			<motion.div
				className="mt-6 sm:mx-auto sm:w-full sm:max-w-md"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, delay: 0.1 }}
			>
				<div className="bg-white py-8 px-6 shadow-sm rounded-lg border border-stone-200">
					<div className="flex flex-col items-center">
						{loading ? (
							<div className="flex items-center justify-center py-4">
								<div className="w-5 h-5 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
								<span className="ml-3 text-sm text-stone-600">Signing in...</span>
							</div>
						) : (
							<GoogleLogin
								onSuccess={handleGoogleSuccess}
								onError={handleGoogleError}
								theme="outline"
								size="large"
								text="continue_with"
								shape="rectangular"
							/>
						)}
					</div>
				</div>
			</motion.div>
		</div>
	);
};

export default LoginPage;
