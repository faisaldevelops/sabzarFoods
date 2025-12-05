import { motion } from "framer-motion";
import { Trash, Edit } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useState } from "react";

const ProductsList = () => {
  const { deleteProduct, products, updateProduct } = useProductStore();
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    price: "",
    stockQuantity: "",
    image: "",
  });

  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stockQuantity: product.stockQuantity,
      image: product.image,
    });
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
    setEditForm({
      name: "",
      description: "",
      price: "",
      stockQuantity: "",
      image: "",
    });
  };

  const handleEditSave = async () => {
    if (editingProduct) {
      const updatedData = {
        name: editForm.name,
        description: editForm.description,
        price: parseFloat(editForm.price),
        stockQuantity: parseInt(editForm.stockQuantity, 10),
        image: editForm.image,
      };
      await updateProduct(editingProduct, updatedData);
      setEditingProduct(null);
      setEditForm({
        name: "",
        description: "",
        price: "",
        stockQuantity: "",
        image: "",
      });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, WebP, or GIF)');
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        alert('Image size must be less than 5MB');
        e.target.value = '';
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        aria-label={`Edit ${product.name}`}
                        className="text-emerald-400 hover:text-emerald-300 focus:outline-none"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        aria-label={`Delete ${product.name}`}
                        className="text-red-400 hover:text-red-300 focus:outline-none"
                      >
                        <Trash className="h-5 w-5" />
                      </button>
                    </div>
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
            </div>

            <div className="flex flex-col items-end gap-2">
              <button
                onClick={() => handleEditClick(product)}
                aria-label={`Edit ${product.name}`}
                className="p-2 rounded-md bg-gray-700 text-emerald-400 hover:text-emerald-300 focus:outline-none"
              >
                <Edit className="h-5 w-5" />
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

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-white mb-4">Edit Product</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  step="0.01"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={editForm.stockQuantity}
                  onChange={(e) => setEditForm({ ...editForm, stockQuantity: e.target.value })}
                  min="0"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {editForm.image && (
                  <img src={editForm.image} alt="Preview" className="mt-2 h-32 w-32 object-cover rounded-md" />
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleEditSave}
                  className="flex-1 bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleEditCancel}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ProductsList;
