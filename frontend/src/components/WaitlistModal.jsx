import { useState } from "react";
import { X, Mail } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../lib/axios";
import { useUserStore } from "../stores/useUserStore";

const WaitlistModal = ({ isOpen, onClose, product }) => {
	const { user } = useUserStore();
	const [email, setEmail] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Use logged-in user's email if available, otherwise use input
		const userEmail = user?.email;
		const finalEmail = userEmail || email;
		
		if (!finalEmail) {
			toast.error("Please enter your email");
			return;
		}

		// Email validation - only validate if not using user's email
		if (!userEmail) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				toast.error("Please enter a valid email address");
				return;
			}
		}

		setIsSubmitting(true);

		try {
			const response = await axios.post(`/products/${product._id}/waitlist`, {
				email: finalEmail
			});

			if (response.data.success) {
				if (response.data.alreadySubscribed) {
					toast.success(response.data.message);
				} else {
					toast.success(`✅ ${response.data.message}`);
				}
				setEmail("");
				onClose();
			}
		} catch (error) {
			console.error("Error adding to waitlist:", error);
			toast.error(error.response?.data?.message || "Failed to join waitlist. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
				{/* Close button */}
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
					aria-label="Close"
				>
					<X size={24} />
				</button>

				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center gap-3 mb-2">
						<div className="bg-emerald-100 p-2 rounded-full">
							<Mail className="text-emerald-600" size={24} />
						</div>
						<h2 className="text-2xl font-bold text-gray-900">
							Notify Me
						</h2>
					</div>
					<p className="text-gray-600">
						Get notified when <span className="font-semibold">{product.name}</span> is back in stock
					</p>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit}>
					{/* Email notification option */}
					<div className="mb-4">
						<div className="flex items-center gap-3 p-4 rounded-md border-2 border-emerald-500 bg-emerald-50">
							<Mail className="text-emerald-600" size={24} />
							<div className="flex-1">
								<div className="font-medium text-emerald-700">Email Notification</div>
								<div className="text-sm text-emerald-600">
									{user ? `We'll notify ${user.email}` : "Enter your email to get notified"}
								</div>
							</div>
						</div>
					</div>

					{/* Email input - only show if user is not logged in */}
					{!user && (
						<div className="mb-4">
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
								required
							/>
						</div>
					)}

					{/* Submit button */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isSubmitting}
							className={`flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 ${
								isSubmitting ? "opacity-50 cursor-not-allowed" : ""
							}`}
						>
							{isSubmitting ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
									Joining...
								</>
							) : (
								<>
									<Mail size={18} />
									Notify Me
								</>
							)}
						</button>
					</div>
				</form>

				{/* Privacy note */}
				<p className="mt-4 text-xs text-gray-500 text-center">
					We'll send you an email when this product is available.
				</p>
			</div>
		</div>
	);
};

export default WaitlistModal;
