import { Link } from "react-router-dom";

const Footer = () => {
	return (
		<footer className='bg-stone-100 border-t border-stone-200 mt-auto'>
			<div className='container mx-auto px-4 py-8'>
				<div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
					{/* About Section */}
					<div>
						<h3 className='text-base font-semibold text-stone-900 mb-3'>About Us</h3>
						<p className='text-sm text-stone-600'>
							Coming soon - Learn more about our story and mission.
						</p>
					</div>

					{/* Policies Section */}
					<div>
						<h3 className='text-base font-semibold text-stone-900 mb-3'>Policies</h3>
						<ul className='space-y-2'>
							<li>
								<Link to='#' className='text-sm text-stone-600 hover:text-stone-900 transition-colors'>
									Refund & Return Policy (Coming Soon)
								</Link>
							</li>
							<li>
								<Link to='#' className='text-sm text-stone-600 hover:text-stone-900 transition-colors'>
									Privacy Policy (Coming Soon)
								</Link>
							</li>
							<li>
								<Link to='#' className='text-sm text-stone-600 hover:text-stone-900 transition-colors'>
									Terms of Service (Coming Soon)
								</Link>
							</li>
						</ul>
					</div>

					{/* Contact Section */}
					<div>
						<h3 className='text-base font-semibold text-stone-900 mb-3'>Contact Us</h3>
						<p className='text-sm text-stone-600 mb-2'>
							Coming soon - Get in touch with our support team.
						</p>
					</div>
				</div>

				{/* Copyright */}
				<div className='border-t border-stone-200 mt-8 pt-6'>
					<p className='text-sm text-stone-600 text-center'>
						© {new Date().getFullYear()} Sabzar Foods. All rights reserved.
					</p>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
