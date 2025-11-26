import { motion } from "framer-motion";
import { Trash, Star, Package } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
const ProductsList = () => {
  const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();
  
  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Desktop / Tablet: table for md+ */}
      <div className="hidden md:block">
        <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th
                  scope="col"
                  className="px-12 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Stock
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Category
                </th>

                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Featured
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {(products || []).map((product) => (
                <tr key={product._id} className="hover:bg-gray-700">
                  <td className="px-12 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{product.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">
                      ${Number(product.price ?? 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      product.stockQuantity === 0 
                        ? 'text-red-400' 
                        : product.stockQuantity < 10 
                        ? 'text-yellow-400' 
                        : 'text-green-400'
                    }`}>
                      {product.stockQuantity ?? 0}
                      {product.stockQuantity === 0 && ' (Out of Stock)'}
                      {product.stockQuantity > 0 && product.stockQuantity < 10 && ' (Low Stock)'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-300">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleFeaturedProduct(product._id)}
                      aria-pressed={product.isFeatured ? "true" : "false"}
                      aria-label={product.isFeatured ? `Unfeature ${product.name}` : `Feature ${product.name}`}
                      className={`p-1 rounded-full ${
                        product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
                      } hover:bg-yellow-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
                    >
                      <Star className="h-5 w-5" />
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteProduct(product._id)}
                      aria-label={`Delete ${product.name}`}
                      className="text-red-400 hover:text-red-300 focus:outline-none"
                    >
                      <Trash className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile: stacked cards for small screens */}
      <div className="md:hidden space-y-3 p-3">
        {(products || []).map((product) => (
          <article
            key={product._id}
            className="bg-gray-900 rounded-lg p-3 flex items-start gap-3 hover:bg-gray-800 transition-colors"
            aria-labelledby={`product-${product._id}-name`}
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-16 w-16 rounded-md object-cover flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <h3 id={`product-${product._id}-name`} className="text-sm font-medium text-white truncate">
                {product.name}
              </h3>

              <p className="text-sm text-gray-300 mt-1">
                <span className="font-medium">Price:</span> ${Number(product.price ?? 0).toFixed(2)}
              </p>

              <p className="text-sm mt-1">
                <span className="font-medium text-gray-300">Stock:</span>{' '}
                <span className={`font-medium ${
                  product.stockQuantity === 0 
                    ? 'text-red-400' 
                    : product.stockQuantity < 10 
                    ? 'text-yellow-400' 
                    : 'text-green-400'
                }`}>
                  {product.stockQuantity ?? 0}
                  {product.stockQuantity === 0 && ' (Out)'}
                  {product.stockQuantity > 0 && product.stockQuantity < 10 && ' (Low)'}
                </span>
              </p>

              <p className="text-sm text-gray-300">
                <span className="font-medium">Category:</span> {product.category}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => toggleFeaturedProduct(product._id)}
                aria-pressed={product.isFeatured ? "true" : "false"}
                aria-label={product.isFeatured ? `Unfeature ${product.name}` : `Feature ${product.name}`}
                className={`p-2 rounded-md ${
                  product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
                } hover:bg-yellow-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
              >
                <Star className="h-5 w-5" />
              </button>

              <button
                onClick={() => deleteProduct(product._id)}
                aria-label={`Delete ${product.name}`}
                className="p-2 rounded-md bg-gray-700 text-red-400 hover:text-red-300 focus:outline-none"
              >
                <Trash className="h-5 w-5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  );
};

export default ProductsList;

// const ProductsList = () => {
// 	const { deleteProduct, toggleFeaturedProduct, products } = useProductStore();

// 	console.log("products", products);

// 	return (
// 		<motion.div
// 			className='bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
// 			initial={{ opacity: 0, y: 20 }}
// 			animate={{ opacity: 1, y: 0 }}
// 			transition={{ duration: 0.8 }}
// 		>
// 			<table className=' min-w-full divide-y divide-gray-700'>
// 				<thead className='bg-gray-700'>
// 					<tr>
// 						<th
// 							scope='col'
// 							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
// 						>
// 							Product
// 						</th>
// 						<th
// 							scope='col'
// 							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
// 						>
// 							Price
// 						</th>
// 						<th
// 							scope='col'
// 							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
// 						>
// 							Category
// 						</th>

// 						<th
// 							scope='col'
// 							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
// 						>
// 							Featured
// 						</th>
// 						<th
// 							scope='col'
// 							className='px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider'
// 						>
// 							Actions
// 						</th>
// 					</tr>
// 				</thead>

// 				<tbody className='bg-gray-800 divide-y divide-gray-700'>
// 					{products?.map((product) => (
// 						<tr key={product._id} className='hover:bg-gray-700'>
// 							<td className='px-6 py-4 whitespace-nowrap'>
// 								<div className='flex items-center'>
// 									<div className='flex-shrink-0 h-10 w-10'>
// 										<img
// 											className='h-10 w-10 rounded-full object-cover'
// 											src={product.image}
// 											alt={product.name}
// 										/>
// 									</div>
// 									<div className='ml-4'>
// 										<div className='text-sm font-medium text-white'>{product.name}</div>
// 									</div>
// 								</div>
// 							</td>
// 							<td className='px-6 py-4 whitespace-nowrap'>
// 								<div className='text-sm text-gray-300'>${product.price.toFixed(2)}</div>
// 							</td>
// 							<td className='px-6 py-4 whitespace-nowrap'>
// 								<div className='text-sm text-gray-300'>{product.category}</div>
// 							</td>
// 							<td className='px-6 py-4 whitespace-nowrap'>
// 								<button
// 									onClick={() => toggleFeaturedProduct(product._id)}
// 									className={`p-1 rounded-full ${
// 										product.isFeatured ? "bg-yellow-400 text-gray-900" : "bg-gray-600 text-gray-300"
// 									} hover:bg-yellow-500 transition-colors duration-200`}
// 								>
// 									<Star className='h-5 w-5' />
// 								</button>
// 							</td>
// 							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
// 								<button
// 									onClick={() => deleteProduct(product._id)}
// 									className='text-red-400 hover:text-red-300'
// 								>
// 									<Trash className='h-5 w-5' />
// 								</button>
// 							</td>
// 						</tr>
// 					))}
// 				</tbody>
// 			</table>
// 		</motion.div>
// 	);
// };
// export default ProductsList;


