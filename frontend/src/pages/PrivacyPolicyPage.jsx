import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicyPage = () => {
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
					<h1 className='text-3xl font-bold text-stone-900 mb-2'>Privacy Policy</h1>
					<p className='text-sm text-stone-600 mb-8'>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

					<div className='prose prose-stone max-w-none space-y-6'>
						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>1. Introduction</h2>
							<p className='text-stone-700 leading-relaxed'>
								Welcome to Sabzar Foods. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and make purchases from us.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>2. Information We Collect</h2>
							<div className='space-y-3'>
								<h3 className='text-lg font-medium text-stone-800'>2.1 Personal Information</h3>
								<p className='text-stone-700 leading-relaxed'>
									We collect information that you provide directly to us, including:
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li>Name and contact information (phone number, email address)</li>
									<li>Shipping and billing addresses</li>
									<li>Payment information (processed securely through our payment partners)</li>
									<li>Order history and preferences</li>
								</ul>

								<h3 className='text-lg font-medium text-stone-800 mt-4'>2.2 Automatically Collected Information</h3>
								<p className='text-stone-700 leading-relaxed'>
									When you visit our website, we automatically collect certain information about your device, including:
								</p>
								<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
									<li>IP address and browser type</li>
									<li>Pages you visit and time spent on pages</li>
									<li>Referring website addresses</li>
									<li>Device information and operating system</li>
								</ul>
							</div>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>3. How We Use Your Information</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								We use the information we collect to:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Process and fulfill your orders</li>
								<li>Send you order confirmations and updates</li>
								<li>Communicate with you about products, services, and promotions</li>
								<li>Improve our website and customer experience</li>
								<li>Detect and prevent fraud and abuse</li>
								<li>Comply with legal obligations</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>4. Information Sharing and Disclosure</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								We do not sell your personal information. We may share your information only in the following circumstances:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>With service providers who assist us in operating our website and conducting our business</li>
								<li>With shipping and delivery partners to fulfill your orders</li>
								<li>With payment processors to handle transactions</li>
								<li>When required by law or to protect our rights and safety</li>
								<li>In connection with a business transfer or merger</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>5. Data Security</h2>
							<p className='text-stone-700 leading-relaxed'>
								We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>6. Your Rights</h2>
							<p className='text-stone-700 leading-relaxed mb-3'>
								You have the right to:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4'>
								<li>Access and receive a copy of your personal information</li>
								<li>Request correction of inaccurate or incomplete information</li>
								<li>Request deletion of your personal information</li>
								<li>Opt-out of marketing communications</li>
								<li>Withdraw consent where processing is based on consent</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>7. Cookies and Tracking Technologies</h2>
							<p className='text-stone-700 leading-relaxed'>
								We use cookies and similar tracking technologies to enhance your browsing experience, analyze website traffic, and understand where our visitors are coming from. You can control cookie preferences through your browser settings.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>8. Children's Privacy</h2>
							<p className='text-stone-700 leading-relaxed'>
								Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>9. Changes to This Privacy Policy</h2>
							<p className='text-stone-700 leading-relaxed'>
								We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
							</p>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>10. Contact Us</h2>
							<p className='text-stone-700 leading-relaxed'>
								If you have any questions about this Privacy Policy or our privacy practices, please contact us through our website or customer support channels.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PrivacyPolicyPage;

