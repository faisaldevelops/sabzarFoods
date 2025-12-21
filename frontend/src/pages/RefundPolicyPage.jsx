const contactDetails = {
	whatsapp: "+91-7051896324",
	email: "orders@sabzarfoods.in",
	postal: "Sabzar Foods, Main Chowk, Kupwara Dist Kupwara, J&K, India. 193222",
};

const RefundPolicyPage = () => {
	return (
		<div className='bg-stone-50 min-h-screen text-stone-900'>
			<div className='max-w-4xl mx-auto px-4 py-16 space-y-12'>
				<header className='space-y-3'>
					<p className='text-xs uppercase tracking-[0.2em] text-stone-500'>Customer Care</p>
					<h1 className='text-3xl md:text-4xl font-semibold'>Return & Refund Policy</h1>
					<p className='text-base text-stone-600'>
						We appreciate you showing interest in Sabzar Foods. If you are anything less than completely satisfied with your order, please review the terms below.
					</p>
				</header>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>Order Cancellations</h2>
					<ul className='space-y-3 text-sm text-stone-700'>
						<li><span className='font-medium text-stone-900'>Right to cancel:</span> You can cancel within 2 hours of placing the order—no reason required.</li>
						<li><span className='font-medium text-stone-900'>Cancellation deadline:</span> 2 hours from the order time for the goods.</li>
						<li>
							<span className='font-medium text-stone-900'>How to cancel:</span> Share your cancellation request and Order ID via email at <a className='text-emerald-700 hover:text-emerald-800 underline' href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a> or WhatsApp at <a className='text-emerald-700 hover:text-emerald-800 underline' href='https://wa.me/917051896324' rel='noreferrer' target='_blank'>start a chat</a>.
						</li>
					</ul>
				</section>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>Refunds</h2>
					<p className='text-sm text-stone-700'>
						Reimbursements are processed within 14 days from when we receive your cancellation notice. Refunds are issued to your original payment method with no additional fees.
					</p>
					<p className='text-sm text-stone-700 font-medium'>Important: Orders already dispatched are not eligible for cancellation.</p>
				</section>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>No Returns or Exchange Policy</h2>
					<p className='text-sm text-stone-700'>Due to the perishable nature of our products, we cannot accept returns or exchanges.</p>
				</section>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>Damaged Shipments</h2>
					<ul className='space-y-3 text-sm text-stone-700'>
						<li><span className='font-medium text-stone-900'>Notify us:</span> Contact us within 72 hours of receiving a damaged order.</li>
						<li><span className='font-medium text-stone-900'>Proof required:</span> Share images or a video of the damaged items along with your Order ID via email or WhatsApp.</li>
						<li><span className='font-medium text-stone-900'>Review:</span> We will review the evidence to verify authenticity before issuing a replacement.</li>
					</ul>
				</section>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>Policy Limitations</h2>
					<p className='text-sm text-stone-700'>We may limit the amount of refunds or replacements provided and may refuse replacements for merchandise that does not meet the conditions above.</p>
				</section>

				<section className='space-y-4'>
					<h2 className='text-xl font-semibold'>Contact Us</h2>
					<ul className='space-y-2 text-sm text-stone-700'>
						<li><span className='font-medium text-stone-900'>WhatsApp:</span> <a className='text-emerald-700 hover:text-emerald-800 underline' href='https://wa.me/917051896324' rel='noreferrer' target='_blank'>{contactDetails.whatsapp}</a></li>
						<li><span className='font-medium text-stone-900'>Email:</span> <a className='text-emerald-700 hover:text-emerald-800 underline' href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a></li>
						<li><span className='font-medium text-stone-900'>Post:</span> {contactDetails.postal}</li>
					</ul>
				</section>
			</div>
		</div>
	);
};

export default RefundPolicyPage;
