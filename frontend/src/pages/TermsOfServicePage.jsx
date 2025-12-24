import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfServicePage = () => {
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
					<h1 className='text-3xl font-bold text-stone-900 mb-2'>Terms of Service</h1>
					<p className='text-sm text-stone-600 mb-8'>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

					<div className='prose prose-stone max-w-none space-y-6'>
						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>1. Acceptance of Terms</h2>
							<p className='text-stone-700 leading-relaxed'>
								By accessing and using the Sabzar Foods website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>2. Use License</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								Permission is granted to temporarily access the materials on Sabzar Foods' website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Modify or copy the materials</li>
								<li>Use the materials for any commercial purpose or for any public display</li>
								<li>Attempt to reverse engineer any software contained on the website</li>
								<li>Remove any copyright or other proprietary notations from the materials</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>3. Account Registration</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								To make purchases on our website, you may be required to create an account. You agree to:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Provide accurate, current, and complete information during registration</li>
								<li>Maintain and promptly update your account information</li>
								<li>Maintain the security of your password and identification</li>
								<li>Accept all responsibility for activities that occur under your account</li>
								<li>Notify us immediately of any unauthorized use of your account</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>4. Products and Pricing</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions or other content on this site is accurate, complete, reliable, current, or error-free.
								</p>
								<p className='text-stone-700 leading-relaxed'>
									Prices are subject to change without notice. We reserve the right to modify or discontinue products at any time without prior notice.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>5. Orders and Payment</h2>
							<div className='space-y-3'>
								<p className='text-stone-700 leading-relaxed'>
									When you place an order, you are making an offer to purchase products at the prices stated. We reserve the right to accept or reject your order for any reason, including product availability, errors in pricing, or issues identified by our fraud prevention team.
								</p>
								<p className='text-stone-700 leading-relaxed'>
									Payment must be received by us before we ship your order. We accept various payment methods as displayed on our website. All payments are processed securely through our payment partners.
								</p>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>6. Shipping and Delivery</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								We will make every effort to deliver products within the estimated timeframe. However, delivery times are estimates and not guaranteed. We are not responsible for delays caused by:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Carrier delays</li>
								<li>Weather conditions</li>
								<li>Incorrect shipping addresses</li>
								<li>Circumstances beyond our control</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>7. Returns and Refunds</h2>
							<p className='text-stone-700 leading-relaxed'>
								Please refer to our <Link to='/refund-return-policy' className='text-stone-800 underline hover:text-stone-900'>Refund & Return Policy</Link> for detailed information about returns, refunds, and exchanges.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>8. Prohibited Uses</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								You may not use our website:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>In any way that violates any applicable law or regulation</li>
								<li>To transmit any malicious code or viruses</li>
								<li>To impersonate or attempt to impersonate the company or any employee</li>
								<li>In any way that infringes upon the rights of others</li>
								<li>To engage in any automated use of the system</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>9. Intellectual Property</h2>
							<p className='text-stone-700 leading-relaxed'>
								All content on this website, including text, graphics, logos, images, and software, is the property of Sabzar Foods or its content suppliers and is protected by copyright and other intellectual property laws.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>10. Limitation of Liability</h2>
							<p className='text-stone-700 leading-relaxed'>
								In no event shall Sabzar Foods or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we or our authorized representative has been notified orally or in writing of the possibility of such damage.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>11. Indemnification</h2>
							<p className='text-stone-700 leading-relaxed'>
								You agree to indemnify, defend, and hold harmless Sabzar Foods and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses arising out of or in any way connected with your access to or use of our website or violation of these Terms of Service.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>12. Governing Law</h2>
							<p className='text-stone-700 leading-relaxed'>
								These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction in which Sabzar Foods operates, without regard to its conflict of law provisions.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>13. Changes to Terms</h2>
							<p className='text-stone-700 leading-relaxed'>
								We reserve the right to modify these Terms of Service at any time. We will notify users of any material changes by posting the new Terms of Service on this page and updating the "Last updated" date. Your continued use of the website after such modifications constitutes acceptance of the updated terms.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>14. Contact Information</h2>
							<p className='text-stone-700 leading-relaxed'>
								If you have any questions about these Terms of Service, please contact us through our website or customer support channels.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default TermsOfServicePage;

