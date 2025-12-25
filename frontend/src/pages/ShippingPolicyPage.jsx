import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ShippingPolicyPage = () => {
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
					<h1 className='text-3xl font-bold text-stone-900 mb-2'>Shipping Policy</h1>
					<p className='text-sm text-stone-600 mb-8'>Last updated: 19th December 2025</p>

					<div className='prose prose-stone max-w-none space-y-6'>
						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>Interpretation and Definitions</h2>
							
							<h3 className='text-lg font-medium text-stone-800 mb-3 mt-4'>Interpretation</h3>
							<p className='text-stone-700 leading-relaxed mb-4'>
								The words of which the initial letter is capitalised have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
							</p>

							<h3 className='text-lg font-medium text-stone-800 mb-3 mt-4'>Definitions</h3>
							<p className='text-stone-700 leading-relaxed mb-2'>
								For the purposes of this Return and Refund Policy:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-2 ml-4'>
								<li><strong className='text-stone-900'>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Main Chowk, Kupwara, India 193222.</li>
								<li><strong className='text-stone-900'>Goods</strong> refer to the items offered for sale on the Service.</li>
								<li><strong className='text-stone-900'>Orders</strong> mean a request by You to purchase Goods from Us.</li>
								<li><strong className='text-stone-900'>Service</strong> refers to the Website.</li>
								<li><strong className='text-stone-900'>Website</strong> refers to Sabzar Foods, accessible from <a href='https://www.sabzarfoods.in' target='_blank' rel='noopener noreferrer' className='text-stone-800 underline hover:text-stone-900'>https://www.sabzarfoods.in</a></li>
								<li><strong className='text-stone-900'>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>Shipping Duration</h2>
							<p className='text-stone-700 leading-relaxed mb-4'>
								We endeavour but do not guarantee to deliver the products to buyers within the suggested shipping times mentioned below:
							</p>
							
							<div className='mb-6'>
								<div className='overflow-x-auto'>
									<table className='min-w-full border border-stone-300 text-sm'>
										<thead className='bg-stone-100'>
											<tr>
												<th className='border border-stone-300 px-4 py-2 text-left text-stone-900 font-semibold'>Zone</th>
												<th className='border border-stone-300 px-4 py-2 text-left text-stone-900 font-semibold'>Duration</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>DELHI/NCR</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>1-2 business days</td>
											</tr>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>NORTH Zone</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>2-4 business days</td>
											</tr>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>CENTRAL & WEST Zone</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>3-5 business days</td>
											</tr>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>SOUTH Zone</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>4-8 business days</td>
											</tr>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>EAST Zone</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>4-5 business days</td>
											</tr>
											<tr>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>NORTH EAST Zone</td>
												<td className='border border-stone-300 px-4 py-2 text-stone-700'>6-15 business days</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>

							<p className='text-stone-700 leading-relaxed mb-4 text-sm italic'>
								*Orders placed before 11 AM are usually processed and dispatched the same day. All shipments are packed and manifested for dispatch within 2 business days of placing the order. We currently dispatch orders from our South Delhi warehouse location.
							</p>

							<p className='text-stone-700 leading-relaxed mb-4'>
								Other factors leading to a delay in delivery may be through the courier partner, transporters' strike, holidays etc. We will not be held responsible for any such delays. We reserve the right to make delivery of the goods by instalments. If the goods are to be delivered in instalments, each delivery will constitute a separate contract. You may not treat the contract (as a whole) as repudiated if we fail to deliver any one or more of the instalments or if you have a claim in respect of any one or more of the instalments. If you fail to take delivery of the goods, we may at our discretion charge you for the additional shipping cost.
							</p>

							<p className='text-stone-700 leading-relaxed mb-4'>
								If you have specified a third party recipient for delivery purposes (for example as a gift) then you accept that evidence of a porch delivery at the address given (or at that delivery address) is evidence of delivery and fulfilment by us of our obligation. Also, an optional sms with multiple delivery options is shared by our delivery partner wherever the service is available. Choosing an option is not mandatory, however, in the case, a customer chooses a custom delivery option, all liabilities of service / product delivery now would transfer to the customer, and we will be absolved of responsibility, thus evidence of delivery and fulfilment by us of our obligation. Estimated delivery times are to be used as a guide only and commence from the date of dispatch. We are not responsible for any delays caused by third party delivery agencies and/or due to time required for statutory clearances during the delivery process.
							</p>

							<p className='text-stone-700 leading-relaxed mb-4'>
								Further, we may at times be unable to deliver the confirmed order(s) to you and the reason for the same could be inclusive of but not limited to the following:
							</p>
							<ol className='list-none text-stone-700 space-y-1 ml-4 mb-4'>
								<li className='flex'><span className='mr-2'>(i)</span><span>unavailability of the relevant product;</span></li>
								<li className='flex'><span className='mr-2'>(ii)</span><span>failure of the concerned manufacturer/supplier/designer/importer to deliver relevant product to us;</span></li>
								<li className='flex'><span className='mr-2'>(iii)</span><span>poor/improper/defective quality of the relevant product ascertained through our quality audit process; and</span></li>
								<li className='flex'><span className='mr-2'>(iv)</span><span>inaccuracies or errors in product or pricing information. In the event of any circumstance(s) as aforementioned; you shall not be entitled to any damages or monetary compensation.</span></li>
							</ol>

							<p className='text-stone-700 leading-relaxed mb-4'>
								In the event we are unable to deliver the confirmed order(s) as mentioned herein above and the payment for such order(s) has been made by you through your credit/debit card, the amount paid by you while placing the order(s) on the Site will be reversed back in your card account. No refunds shall be applicable on the orders made by the Users under the Cash on Delivery ("COD") option.
							</p>

							<p className='text-stone-700 leading-relaxed mb-4'>
								In case you do not receive your order within the specified time please get in touch with us at:
							</p>
							<ul className='list-disc list-inside text-stone-700 space-y-1 ml-4 mb-6'>
								<li>Email: <a href='mailto:orders@sabzarfoods.in' className='text-stone-800 underline hover:text-stone-900'>orders@sabzarfoods.in</a></li>
								<li className='flex items-center gap-2'>Phone: <a href='https://wa.me/917051896324' target='_blank' rel='noopener noreferrer' className='text-stone-800 hover:text-stone-900 inline-flex items-center'>
									<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='currentColor' className='text-emerald-600'>
										<path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z'/>
									</svg>
								</a></li>
							</ul>
						</section>

						<section>
							<h2 className='text-xl font-semibold text-stone-900 mb-3'>Free Shipping</h2>
							<p className='text-stone-700 leading-relaxed mb-4'>
								Free shipping is only applicable on all prepaid orders above Rs 1299. This is only valid if the order is sent to one address. In the case of gifting and customised orders which you order from us through phone additional charges may be incurred on shipping.
							</p>
						</section>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ShippingPolicyPage;

