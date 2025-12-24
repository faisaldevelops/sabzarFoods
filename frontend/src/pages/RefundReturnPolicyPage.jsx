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
					<h1 className='text-3xl font-bold text-stone-900 mb-2'>Refund & Return Policy</h1>
					<p className='text-sm text-stone-600 mb-8'>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

					<div className='prose prose-stone max-w-none space-y-6'>
						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>1. Overview</h2>
							<p className='text-stone-700 leading-relaxed'>
								At Sabzar Foods, we want you to be completely satisfied with your purchase. This Refund & Return Policy outlines the terms and conditions for returns, refunds, and exchanges of products purchased through our website.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>2. Return Eligibility</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									To be eligible for a return, the following conditions must be met:
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li>Items must be returned within 7 days of delivery</li>
									<li>Products must be in their original, unopened condition</li>
									<li>Items must be in their original packaging with all tags and labels attached</li>
									<li>Proof of purchase (order number or receipt) must be provided</li>
								</ul>
								<p className='text-stone-700 leading-relaxed mt-3'>
									<strong className='text-stone-900'>Note:</strong> Due to the nature of food products, certain items may not be eligible for return once opened or if they are perishable. Please check product descriptions for specific return eligibility.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>3. Non-Returnable Items</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								The following items cannot be returned:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Perishable food items that have been opened or consumed</li>
								<li>Items damaged by misuse or normal wear and tear</li>
								<li>Products without original packaging or missing components</li>
								<li>Items returned after the 7-day return period</li>
								<li>Customized or personalized products</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>4. How to Initiate a Return</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									To initiate a return, please follow these steps:
								</p>
								<ol className='list-decimal list-inside text-stone-700 space-y-2 ml-4'>
									<li>Contact our customer support team with your order number</li>
									<li>Provide a reason for the return</li>
									<li>Wait for return authorization and instructions</li>
									<li>Package the item securely in its original packaging</li>
									<li>Ship the item back using the provided return shipping label or instructions</li>
								</ol>
								<p className='text-stone-700 leading-relaxed mt-3'>
									Please do not return items without first contacting our customer support team.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>5. Return Shipping</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									Return shipping costs are handled as follows:
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li><strong className='text-stone-900'>Defective or Damaged Items:</strong> We will cover the return shipping costs</li>
									<li><strong className='text-stone-900'>Wrong Item Received:</strong> We will cover the return shipping costs</li>
									<li><strong className='text-stone-900'>Customer Change of Mind:</strong> The customer is responsible for return shipping costs</li>
								</ul>
								<p className='text-stone-700 leading-relaxed mt-3'>
									We recommend using a trackable shipping service and retaining proof of shipment until your return is processed.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>6. Refund Process</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									Once we receive and inspect your returned item, we will:
								</p>
								<ol className='list-decimal list-inside text-stone-700 space-y-1 ml-4'>
									<li>Send you an email notification confirming receipt of your return</li>
									<li>Inspect the item to ensure it meets our return criteria</li>
									<li>Process your refund within 5-7 business days</li>
									<li>Issue the refund to your original payment method</li>
								</ol>
								<p className='text-stone-700 leading-relaxed mt-3'>
									<strong className='text-stone-900'>Refund Timeline:</strong> Refunds typically appear in your account within 5-10 business days after processing, depending on your payment provider.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>7. Refund Amount</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								The refund amount will include:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>The full purchase price of the returned item(s)</li>
								<li>Original shipping costs (if the return is due to our error or defective product)</li>
							</ul>
							<p className='text-stone-700 leading-relaxed mt-3'>
								<strong className='text-stone-900'>Note:</strong> If the return is due to customer change of mind, original shipping costs are non-refundable, and return shipping costs will be deducted from the refund amount.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>8. Exchanges</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								We currently do not offer direct exchanges. If you wish to exchange an item:
							</p>
							<ol className='list-decimal list-inside text-stone-700 space-y-1 ml-4'>
								<li>Return the original item following our return process</li>
								<li>Place a new order for the desired item</li>
							</ol>
							<p className='text-stone-700 leading-relaxed mt-3'>
								We will process your refund promptly so you can use it for your new purchase.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>9. Damaged or Defective Items</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								If you receive a damaged or defective item:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Contact us immediately (within 48 hours of delivery)</li>
								<li>Provide photos of the damage or defect</li>
								<li>Include your order number</li>
								<li>We will arrange for a replacement or full refund at no cost to you</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>10. Cancellations</h2>
							<p className='text-stone-700 leading-relaxed'>
								You may cancel your order before it ships. Once an order has been shipped, it cannot be cancelled, but you may return it following our return policy. To cancel an order, please contact our customer support team as soon as possible with your order number.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>11. Late or Missing Refunds</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								If you haven't received your refund yet:
							</p>
							<ol className='list-decimal list-inside text-stone-700 space-y-1 ml-4'>
								<li>Check your bank account or payment method statement</li>
								<li>Contact your bank or payment provider (processing may take time)</li>
								<li>Contact us if more than 10 business days have passed</li>
							</ol>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>12. Contact Us</h2>
							<p className='text-stone-700 leading-relaxed'>
								If you have any questions about our Refund & Return Policy or need assistance with a return, please contact our customer support team through our website. We're here to help ensure your satisfaction with every purchase.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default RefundReturnPolicyPage;

