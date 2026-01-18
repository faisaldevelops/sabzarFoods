import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, Loader2 } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const FeedbackPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		feedbackType: "",
		message: "",
	});
	const [notARobot, setNotARobot] = useState(false);
	const [honeypotTime, setHoneypotTime] = useState(Date.now());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);

	const feedbackTypes = [
		{ value: "general", label: "General Feedback" },
		{ value: "suggestion", label: "Suggestion" },
		{ value: "complaint", label: "Complaint" },
		{ value: "product", label: "Product Feedback" },
		{ value: "delivery", label: "Delivery Issue" },
		{ value: "website", label: "Website Issue" },
		{ value: "other", label: "Other" },
	];

	// Set honeypot timing on mount
	useEffect(() => {
		setHoneypotTime(Date.now());
	}, []);

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (!formData.feedbackType) {
			toast.error("Please select a feedback type");
			return;
		}
		if (!formData.message || formData.message.trim().length < 10) {
			toast.error("Please provide a message (at least 10 characters)");
			return;
		}
		if (!notARobot) {
			toast.error("Please confirm you're not a robot");
			return;
		}

		setIsSubmitting(true);

		try {
			const res = await axios.post("/feedback/submit", {
				...formData,
				notARobot,
				website: "", // Honeypot field - leave empty
				_hp_time: honeypotTime, // Timing honeypot
			});

			if (res.data.success) {
				setIsSubmitted(true);
				toast.success("Feedback submitted successfully!");
			} else {
				toast.error(res.data.message || "Failed to submit feedback");
			}
		} catch (error) {
			const errorMessage = error.response?.data?.message || "Failed to submit feedback. Please try again.";
			toast.error(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	// Success state
	if (isSubmitted) {
		return (
			<div className='min-h-screen bg-stone-50 text-stone-900 py-12 px-4'>
				<div className='max-w-2xl mx-auto'>
					<div className='bg-white rounded-lg shadow-sm border border-stone-200 p-8 text-center'>
						<CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
						<h1 className='text-2xl font-bold text-stone-900 mb-2'>Thank You!</h1>
						<p className='text-stone-600 mb-6'>
							Your feedback has been submitted successfully. We appreciate you taking the time to share your thoughts with us.
						</p>
						<div className='flex flex-col sm:flex-row gap-4 justify-center'>
							<Link
								to='/'
								className='inline-flex items-center justify-center px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors'
							>
								<ArrowLeft size={18} className='mr-2' />
								Back to Home
							</Link>
							<button
								onClick={() => {
									setIsSubmitted(false);
									setFormData({ name: "", email: "", feedbackType: "", message: "" });
									setNotARobot(false);
									setHoneypotTime(Date.now());
								}}
								className='inline-flex items-center justify-center px-6 py-3 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors'
							>
								Submit Another
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className='min-h-screen bg-stone-50 text-stone-900 py-12 px-4'>
			<div className='max-w-2xl mx-auto'>
				<Link
					to='/'
					className='inline-flex items-center text-stone-600 hover:text-stone-900 mb-6 transition-colors'
				>
					<ArrowLeft size={18} className='mr-2' />
					Back to Home
				</Link>

				<div className='bg-white rounded-lg shadow-sm border border-stone-200 p-8'>
					<h1 className='text-2xl font-bold text-stone-900 mb-2'>Share Your Feedback</h1>
					<p className='text-stone-600 mb-6'>
						We value your opinion! Let us know what you think about our products and services. Your feedback helps us improve.
					</p>

					<form onSubmit={handleSubmit} className='space-y-6'>
						{/* Honeypot field - hidden from users, bots will fill it */}
						<div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
							<label htmlFor="website">Website</label>
							<input
								type="text"
								name="website"
								id="website"
								tabIndex={-1}
								autoComplete="off"
							/>
						</div>

						{/* Name (optional) */}
						<div>
							<label htmlFor='name' className='block text-sm font-medium text-stone-700 mb-1'>
								Name <span className='text-stone-400'>(optional)</span>
							</label>
							<input
								type='text'
								id='name'
								name='name'
								value={formData.name}
								onChange={handleChange}
								placeholder='Your name'
								maxLength={100}
								className='w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors'
							/>
						</div>

						{/* Email (optional) */}
						<div>
							<label htmlFor='email' className='block text-sm font-medium text-stone-700 mb-1'>
								Email <span className='text-stone-400'>(optional - if you want a response)</span>
							</label>
							<input
								type='email'
								id='email'
								name='email'
								value={formData.email}
								onChange={handleChange}
								placeholder='your.email@example.com'
								maxLength={200}
								className='w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors'
							/>
						</div>

						{/* Feedback Type */}
						<div>
							<label htmlFor='feedbackType' className='block text-sm font-medium text-stone-700 mb-1'>
								Feedback Type <span className='text-red-500'>*</span>
							</label>
							<select
								id='feedbackType'
								name='feedbackType'
								value={formData.feedbackType}
								onChange={handleChange}
								required
								className='w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors bg-white'
							>
								<option value=''>Select a type...</option>
								{feedbackTypes.map((type) => (
									<option key={type.value} value={type.value}>
										{type.label}
									</option>
								))}
							</select>
						</div>

						{/* Message */}
						<div>
							<label htmlFor='message' className='block text-sm font-medium text-stone-700 mb-1'>
								Your Feedback <span className='text-red-500'>*</span>
							</label>
							<textarea
								id='message'
								name='message'
								value={formData.message}
								onChange={handleChange}
								placeholder='Tell us what you think... (minimum 10 characters)'
								rows={5}
								maxLength={5000}
								required
								className='w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors resize-none'
							/>
							<p className='text-xs text-stone-400 mt-1 text-right'>
								{formData.message.length}/5000
							</p>
						</div>

						{/* Simple Checkbox Captcha */}
						<div className='bg-stone-50 rounded-lg p-4 border border-stone-200'>
							<label className='flex items-center gap-3 cursor-pointer'>
								<input
									type='checkbox'
									checked={notARobot}
									onChange={(e) => setNotARobot(e.target.checked)}
									className='w-5 h-5 rounded border-stone-300 text-stone-800 focus:ring-stone-500 cursor-pointer'
								/>
								<span className='text-sm font-medium text-stone-700'>
									I'm not a robot <span className='text-red-500'>*</span>
								</span>
							</label>
						</div>

						{/* Submit Button */}
						<button
							type='submit'
							disabled={isSubmitting}
							className='w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700 focus:ring-4 focus:ring-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
						>
							{isSubmitting ? (
								<>
									<Loader2 size={18} className='animate-spin' />
									Submitting...
								</>
							) : (
								<>
									<Send size={18} />
									Submit Feedback
								</>
							)}
						</button>
					</form>

					<p className='text-xs text-stone-500 text-center mt-6'>
						Your feedback is anonymous unless you choose to provide your name or email.
						We do not share your information with third parties.
					</p>
				</div>
			</div>
		</div>
	);
};

export default FeedbackPage;
