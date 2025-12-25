import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const RefundReturnPolicyPage = () => {
	return (
		<div className='min-h-screen bg-stone-50 text-stone-900 py-12 px-4'>
			<div className='max-w-4xl mx-auto'>
				<Link
					to='/'
					className='inline-flex items-center text-stone-600 hover:text-stone-900 mb-6 transition-colors'
				>
					<ArrowLeft size={18} className='mr-2' />
					Back to Home
				</Link>

				<div className='bg-white rounded-lg shadow-sm border border-stone-200 p-8'>
					<h1 className='text-3xl font-bold text-stone-900 mb-2'>Return and Refund Policy</h1>
					<p className='text-sm text-stone-600 mb-8'>Last updated: 19th December 2025</p>

					<div className='prose prose-stone max-w-none space-y-6'>
						<section>
							<p className='text-stone-700 leading-relaxed mb-4'>
								We appreciate you showing interest in Sabzar Foods.
							</p>
							<p className='text-stone-700 leading-relaxed mb-4'>
								Should you be anything less than completely satisfied with your order, we encourage you to consult our detailed policy regarding refunds and returns.
							</p>
							<p className='text-stone-700 leading-relaxed'>
								The terms and conditions outlined below govern all products you have purchased from us.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>Order Cancellations</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								You have the right to cancel your order within 2 hours of placing it, without needing to provide any reason.
							</p>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									<strong className='text-stone-900'>Cancellation Deadline:</strong>
								</p>
								<p className='text-stone-700 leading-relaxed ml-4'>
									The deadline for cancelling an order is 2 hours from the time you place the order for the Goods.
								</p>
								<p className='text-stone-700 leading-relaxed mt-4'>
									<strong className='text-stone-900'>How to Cancel:</strong>
								</p>
								<p className='text-stone-700 leading-relaxed mb-2 ml-4'>
									To exercise your right to cancel, you must clearly inform us of your decision and provide your Order ID. You can notify us by:
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-8'>
									<li>Emailing us at <a href='mailto:orders@sabzarfoods.in' className='text-stone-800 underline hover:text-stone-900'>orders@sabzarfoods.in</a>.</li>
									<li>Sending a WhatsApp text message. <a href='https://wa.me/917051896324' target='_blank' rel='noopener noreferrer' className='text-stone-800 hover:text-stone-900 inline-flex items-center gap-1'>
										<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='currentColor' className='text-emerald-600'>
											<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
										</svg>
									</a> on WhatsApp.</li>
								</ul>
								<p className='text-stone-700 leading-relaxed mt-4'>
									<strong className='text-stone-900'>Refunds:</strong>
								</p>
								<p className='text-stone-700 leading-relaxed ml-4'>
									We will process your reimbursement no later than 14 days from the day on which we receive the cancellation notice. The refund will be issued using the same method of payment you used for the original order, and you will not incur any fees for this reimbursement.
								</p>
								<p className='text-stone-700 leading-relaxed mt-4 font-medium'>
									<strong className='text-stone-900'>Important Note:</strong> Orders that have already been dispatched are not eligible for cancellation.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>No Returns or Exchange Policy</h2>
							<h3 className='text-lg font-medium text-stone-800 mb-3'>Sabzar Food TV - Replacement Policy</h3>
							<p className='text-stone-700 leading-relaxed mb-4'>
								Due to the perishable nature of our products, we unfortunately cannot accept returns.
							</p>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									<strong className='text-stone-900'>Damaged Shipments:</strong>
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li>If your order arrives damaged, you must contact us within 72 hours of receipt.</li>
									<li>To request a replacement, please send images or a video of the damaged items, along with your order ID, via email or WhatsApp.</li>
									<li>We reserve the right to review the submitted images/videos and determine the authenticity of the damage before issuing a replacement order.</li>
								</ul>
								<p className='text-stone-700 leading-relaxed mt-4'>
									<strong className='text-stone-900'>Limitation of Policy:</strong> We reserve the right to limit the amount of refunds or replacements provided. We also reserve the right, in our sole discretion, to refuse a replacement for any merchandise that does not comply with the conditions outlined above.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>Contact Us</h2>
							<p className='text-stone-700 leading-relaxed mb-4'>
								Should you have any inquiries regarding our Returns and Refunds Policy, please feel free to reach out to us through the following contact methods:
							</p>
							<div className='space-y-2 ml-4'>
								<p className='text-stone-700 leading-relaxed'>
									<strong className='text-stone-900'>Contact Information:</strong>
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li className='flex items-center gap-2'>WhatsApp: <a href='https://wa.me/917051896324' target='_blank' rel='noopener noreferrer' className='text-stone-800 hover:text-stone-900 inline-flex items-center'>
										<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor' className='text-emerald-600'>
											<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
										</svg>
									</a></li>
									<li>Email: <a href='mailto:orders@sabzarfoods.in' className='text-stone-800 underline hover:text-stone-900'>orders@sabzarfoods.in</a></li>
									<li>Post: Sabzar Foods, Main Chowk, Kupwara Dist Kupwara, J&K, India. 193222</li>
								</ul>
							</div>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RefundReturnPolicyPage;

