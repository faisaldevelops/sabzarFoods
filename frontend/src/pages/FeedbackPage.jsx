import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, CheckCircle, Loader2 } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const FeedbackPage = () => {
	const [message, setMessage] = useState("");
	const [honeypotTime, setHoneypotTime] = useState(Date.now());
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSubmitted, setIsSubmitted] = useState(false);
	const captchaRef = useRef(null);
	const pendingSubmitRef = useRef(null);

	// hCaptcha site key - use test key for development, real key for production
	const HCAPTCHA_SITE_KEY = import.meta.env.VITE_HCAPTCHA_SITE_KEY || "10000000-ffff-ffff-ffff-000000000001";

	// Set honeypot timing on mount
	useEffect(() => {
		setHoneypotTime(Date.now());
	}, []);

	// Called when captcha is verified - now submit the form
	const handleCaptchaVerify = async (token) => {
		if (!pendingSubmitRef.current) return;
		
		await submitFeedback(token);
	};

	const handleCaptchaError = () => {
		toast.error("Captcha failed. Please try again.");
		setIsSubmitting(false);
		pendingSubmitRef.current = null;
	};

	const submitFeedback = async (captchaToken) => {
		try {
			const res = await axios.post("/feedback/submit", {
				message,
				captchaToken,
				website: "", // Honeypot field - leave empty
				_hp_time: honeypotTime, // Timing honeypot
			});

			if (res.data.success) {
				setIsSubmitted(true);
				toast.success("Feedback submitted successfully!");
			} else {
				toast.error(res.data.message || "Failed to submit feedback");
				captchaRef.current?.resetCaptcha();
			}
		} catch (error) {
			const errorMessage = error.response?.data?.message || "Failed to submit feedback. Please try again.";
			toast.error(errorMessage);
			captchaRef.current?.resetCaptcha();
		} finally {
			setIsSubmitting(false);
			pendingSubmitRef.current = null;
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (!message || message.trim().length === 0) {
			toast.error("Please provide a message");
			return;
		}

		setIsSubmitting(true);
		pendingSubmitRef.current = true;

		// Trigger invisible captcha - this will open a popup if needed
		// Once verified, handleCaptchaVerify will be called with the token
		captchaRef.current?.execute();
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
									setMessage("");
									setHoneypotTime(Date.now());
									captchaRef.current?.resetCaptcha();
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
						We value your opinion! Let us know what you think about our products and services.
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

						{/* Message */}
						<div>
							<label htmlFor='message' className='block text-sm font-medium text-stone-700 mb-1'>
								Your Feedback
							</label>
							<textarea
								id='message'
								name='message'
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder='Tell us what you think...'
								rows={6}
								maxLength={5000}
								required
								className='w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-stone-500 focus:border-stone-500 transition-colors resize-none'
							/>
							<p className='text-xs text-stone-400 mt-1 text-right'>
								{message.length}/5000
							</p>
						</div>

						{/* Invisible hCaptcha - triggers on submit */}
						<HCaptcha
							ref={captchaRef}
							sitekey={HCAPTCHA_SITE_KEY}
							size="invisible"
							onVerify={handleCaptchaVerify}
							onError={handleCaptchaError}
							onExpire={handleCaptchaError}
						/>

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
						Your feedback is anonymous. We do not share your information with third parties.
					</p>
				</div>
			</div>
		</div>
	);
};

export default FeedbackPage;
