import { useState } from "react";
import { X, Bell, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const WaitlistModal = ({ isOpen, onClose, product }) => {
	const [email, setEmail] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [contactMethod, setContactMethod] = useState("email"); // 'email' or 'phone'
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (!isOpen) return null;

	const handleSubmit = async (e) => {
		e.preventDefault();
		
		const contactValue = contactMethod === "email" ? email : phoneNumber;
		
		if (!contactValue) {
			toast.error(`Please enter your ${contactMethod === "email" ? "email" : "phone number"}`);
			return;
		}

		// Basic email validation
		if (contactMethod === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			toast.error("Please enter a valid email address");
			return;
		}

		// Phone validation - allow various formats (digits, spaces, dashes, parentheses, plus sign)
		if (contactMethod === "phone") {
			const cleanedPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, "");
			if (!/^\d{10,15}$/.test(cleanedPhone)) {
				toast.error("Please enter a valid phone number (10-15 digits)");
				return;
			}
		}

		setIsSubmitting(true);

		try {
			const payload = contactMethod === "email" 
				? { email } 
				: { phoneNumber };

			const response = await axios.post(`/products/${product._id}/waitlist`, payload);

			if (response.data.success) {
				if (response.data.alreadySubscribed) {
					toast.success(response.data.message);
				} else {
					toast.success(`✅ ${response.data.message}`);
				}
				setEmail("");
				setPhoneNumber("");
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
							<Bell className="text-emerald-600" size={24} />
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
					{/* Contact method selector */}
					<div className="mb-4">
						<label className="block text-sm font-medium text-gray-700 mb-2">
							How would you like to be notified?
						</label>
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setContactMethod("email")}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
									contactMethod === "email"
										? "bg-emerald-50 border-emerald-500 text-emerald-700"
										: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
								} transition-colors`}
							>
								<Mail size={18} />
								Email
							</button>
							<button
								type="button"
								onClick={() => setContactMethod("phone")}
								className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md border ${
									contactMethod === "phone"
										? "bg-emerald-50 border-emerald-500 text-emerald-700"
										: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
								} transition-colors`}
							>
								<Phone size={18} />
								SMS
							</button>
						</div>
					</div>

					{/* Email input */}
					{contactMethod === "email" && (
						<div className="mb-4">
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email Address
							</label>
							<input
								type="email"
								id="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="your@email.com"
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
								required
							/>
						</div>
					)}

					{/* Phone input */}
					{contactMethod === "phone" && (
						<div className="mb-4">
							<label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
								Phone Number
							</label>
							<input
								type="tel"
								id="phone"
								value={phoneNumber}
								onChange={(e) => setPhoneNumber(e.target.value)}
								placeholder="+91 1234567890"
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
									<Bell size={18} />
									Notify Me
								</>
							)}
						</button>
					</div>
				</form>

				{/* Privacy note */}
				<p className="mt-4 text-xs text-gray-500 text-center">
					We'll only use your contact information to notify you about this product's availability.
				</p>
			</div>
		</div>
	);
};

export default WaitlistModal;
