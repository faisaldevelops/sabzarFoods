import { motion } from "framer-motion";
import { Trash, Edit, Globe, Mail, CheckSquare, Layers, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { useState } from "react";
import toast from "react-hot-toast";
import { validateImageFile, readFileAsBase64 } from "../lib/imageValidation";
import DeliveryRestrictionSelector from "./DeliveryRestrictionSelector";

const emptyEditForm = {
  name: "",
  description: "",
  actualPrice: "",
  price: "",
  stockQuantity: "",
  image: "",
  isHidden: false,
  isRestricted: false,
  restrictionType: "none",
  restrictedPincodes: [],
  restrictedLocations: [],
};

const ProductsList = () => {
  const { deleteProduct, products, updateProduct, toggleProductVisibility, moveProduct } = useProductStore();
  const [editingProduct, setEditingProduct] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);

  const handleEditClick = (product) => {
    setEditingProduct(product._id);
    setEditForm({
      name: product.name,
      description: product.description,
      actualPrice: product.actualPrice,
      price: product.price,
      stockQuantity: product.stockQuantity,
      image: product.image,
      isHidden: Boolean(product.isHidden),
      isRestricted: product.isRestricted || false,
      restrictionType: product.restrictionType || "none",
      restrictedPincodes: product.restrictedPincodes || [],
      restrictedLocations: product.restrictedLocations || [],
    });
  };

  const handleEditCancel = () => {
    setEditingProduct(null);
    setEditForm(emptyEditForm);
  };

  const handleEditSave = async () => {
    if (editingProduct) {
      // Validate required fields
      if (!editForm.name || !editForm.name.trim()) {
        toast.error('Product name is required');
        return;
      }
      if (!editForm.description || !editForm.description.trim()) {
        toast.error('Product description is required');
        return;
      }
      
      const actualPrice = parseFloat(editForm.actualPrice);
      const price = parseFloat(editForm.price);
      const stockQuantity = parseInt(editForm.stockQuantity, 10);
      
      // Validate numeric values
      if (isNaN(actualPrice) || actualPrice < 0) {
        toast.error('Please enter a valid actual price');
        return;
      }
      if (isNaN(price) || price < 0) {
        toast.error('Please enter a valid selling price');
        return;
      }
      if (isNaN(stockQuantity) || stockQuantity < 0) {
        toast.error('Please enter a valid stock quantity');
        return;
      }

      // Validate restrictions
      if (editForm.restrictionType === "pincodes" && (!editForm.restrictedPincodes || editForm.restrictedPincodes.length === 0)) {
        toast.error('Please add at least one PIN code, or select All India');
        return;
      }

      if (editForm.restrictionType === "districts" && (!editForm.restrictedLocations || editForm.restrictedLocations.length === 0)) {
        toast.error('Please select at least one district, or select All India');
        return;
      }
      
      const updatedData = {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        actualPrice,
        price,
        stockQuantity,
        image: editForm.image,
        isHidden: Boolean(editForm.isHidden),
        isRestricted: editForm.isRestricted,
        restrictionType: editForm.restrictionType,
        restrictedPincodes: editForm.restrictedPincodes,
        restrictedLocations: editForm.restrictedLocations,
      };
      await updateProduct(editingProduct, updatedData);
      setEditingProduct(null);
      setEditForm(emptyEditForm);
    }
  };

  const renderVisibilityBadge = (product) => {
    const isHidden = Boolean(product.isHidden);
    return (
      <button
        type="button"
        onClick={() => toggleProductVisibility(product._id)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
          isHidden
            ? "bg-amber-950/80 text-amber-300 border border-amber-600/70 hover:bg-amber-900/90 hover:scale-105"
            : "bg-emerald-950/80 text-emerald-300 border border-emerald-600/70 hover:bg-emerald-900/90 hover:scale-105"
        }`}
        title={isHidden ? "Hidden from front end (Click to show on homepage)" : "Visible on front end (Click to hide from homepage)"}
        aria-label={isHidden ? `Unhide ${product.name}` : `Hide ${product.name}`}
      >
        {isHidden ? (
          <>
            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Hidden</span>
          </>
        ) : (
          <>
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            <span>Visible</span>
          </>
        )}
      </button>
    );
  };

  const renderOrderControls = (product, index, total) => {
    const isFirst = index === 0;
    const isLast = index === total - 1;

    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-mono font-medium text-gray-400 w-6 text-center">
          #{index + 1}
        </span>
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => moveProduct(product._id, "up")}
            className={`p-1 rounded transition-colors ${
              isFirst
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:text-emerald-400 hover:bg-gray-700 active:scale-95 cursor-pointer"
            }`}
            title={isFirst ? "At top" : "Move up on homepage"}
            aria-label={`Move ${product.name} up`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => moveProduct(product._id, "down")}
            className={`p-1 rounded transition-colors ${
              isLast
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-300 hover:text-emerald-400 hover:bg-gray-700 active:scale-95 cursor-pointer"
            }`}
            title={isLast ? "At bottom" : "Move down on homepage"}
            aria-label={`Move ${product.name} down`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderDeliveryBadge = (product) => {
    if (!product.isRestricted || product.restrictionType === "none") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-700/70 text-gray-300 border border-gray-600/50">
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>All India</span>
        </span>
      );
    }

    if (product.restrictionType === "pincodes") {
      const pinCount = product.restrictedPincodes?.length || 0;
      return (
        <span 
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-700/60"
          title={product.restrictedPincodes?.slice(0, 10).join(", ") + (pinCount > 10 ? "..." : "")}
        >
          <Mail className="w-3 h-3 text-blue-400" />
          <span>{pinCount} PIN code{pinCount !== 1 ? "s" : ""}</span>
        </span>
      );
    }

    if (product.restrictionType === "districts") {
      const locs = product.restrictedLocations || [];
      const totalDistricts = locs.reduce((acc, l) => acc + (l.districts?.length || 0), 0);
      return (
        <span 
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-950/80 text-purple-300 border border-purple-700/60"
          title={locs.map((l) => `${l.state}: ${l.districts?.join(", ")}`).join(" | ")}
        >
          <CheckSquare className="w-3 h-3 text-purple-400" />
          <span className="truncate max-w-[140px]">{locs.length} State{locs.length !== 1 ? "s" : ""} ({totalDistricts} dist)</span>
        </span>
      );
    }

    if (product.restrictionType === "both") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
          <Layers className="w-3 h-3 text-emerald-400" />
          <span>PINs & Districts</span>
        </span>
      );
    }

    return null;
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    const validatedFile = validateImageFile(file, e.target);
    
    if (validatedFile) {
      try {
        const base64 = await readFileAsBase64(validatedFile);
        setEditForm({ ...editForm, image: base64 });
      } catch {
        toast.error('Failed to read image file');
        e.target.value = '';
      }
    }
  };
  
  return (
    <motion.div
      className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-6xl mx-auto"
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
                  className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Order
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Product
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  MRP / Selling
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
                  Visibility
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
                >
                  Delivery Area
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
              {(products || []).map((product, index) => (
                <tr key={product._id} className="hover:bg-gray-700/80 transition-colors">
                  <td className="px-4 py-4 whitespace-nowrap">
                    {renderOrderControls(product, index, products.length)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={product.image}
                          alt={product.name}
                        />
                        {product.isHidden && (
                          <span
                            className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 text-stone-900 shadow"
                            title="Hidden from front end"
                          >
                            <EyeOff className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white flex items-center gap-2">
                          <span>{product.name}</span>
                          {product.isHidden && (
                            <span className="text-[10px] uppercase font-semibold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <span className="text-gray-500 line-through">₹{Number(product.actualPrice ?? 0).toFixed(2)}</span>
                      <span className="text-emerald-400 ml-2 font-medium">₹{Number(product.price ?? 0).toFixed(2)}</span>
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
                    {renderVisibilityBadge(product)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderDeliveryBadge(product)}
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
        {(products || []).map((product, index) => (
          <article
            key={product._id}
            className="bg-gray-900 rounded-lg p-3.5 space-y-3 hover:bg-gray-800/90 transition-colors border border-gray-700/40"
            aria-labelledby={`product-${product._id}-name`}
          >
            {/* Top row: Order position + Up/Down buttons + Visibility toggle */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                  #{index + 1}
                </span>
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveProduct(product._id, "up")}
                  className={`p-1.5 rounded bg-gray-800 ${
                    index === 0
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-300 hover:text-emerald-400 active:scale-95"
                  }`}
                  aria-label={`Move ${product.name} up`}
                  title="Move up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={index === products.length - 1}
                  onClick={() => moveProduct(product._id, "down")}
                  className={`p-1.5 rounded bg-gray-800 ${
                    index === products.length - 1
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-300 hover:text-emerald-400 active:scale-95"
                  }`}
                  aria-label={`Move ${product.name} down`}
                  title="Move down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <div>
                {renderVisibilityBadge(product)}
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-16 w-16 rounded-md object-cover"
                />
                {product.isHidden && (
                  <span
                    className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5 text-stone-900 shadow"
                    title="Hidden from front end"
                  >
                    <EyeOff className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 id={`product-${product._id}-name`} className="text-sm font-medium text-white truncate">
                  {product.name}
                </h3>

                <p className="text-sm mt-1">
                  <span className="font-medium text-gray-400">Price:</span>{' '}
                  <span className="text-gray-500 line-through">₹{Number(product.actualPrice ?? 0).toFixed(2)}</span>
                  <span className="text-emerald-400 ml-1 font-medium">₹{Number(product.price ?? 0).toFixed(2)}</span>
                </p>

                <p className="text-sm mt-1">
                  <span className="font-medium text-gray-400">Stock:</span>{' '}
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

                <div className="mt-1.5 flex items-center gap-1.5">
                  {renderDeliveryBadge(product)}
                </div>
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
            </div>
          </article>
        ))}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Actual Price (MRP)</label>
                  <input
                    type="number"
                    value={editForm.actualPrice}
                    onChange={(e) => setEditForm({ ...editForm, actualPrice: e.target.value })}
                    step="0.01"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Selling Price</label>
                  <input
                    type="number"
                    value={editForm.price}
                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                    step="0.01"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
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

              {/* Visibility Toggle */}
              <div className="p-3.5 bg-gray-700/60 border border-gray-600 rounded-md">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="editIsHidden"
                    checked={editForm.isHidden || false}
                    onChange={(e) => setEditForm({ ...editForm, isHidden: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-emerald-600 bg-gray-800 border-gray-500 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white flex items-center gap-2">
                      {editForm.isHidden ? (
                        <span className="text-amber-400 flex items-center gap-1.5">
                          <EyeOff className="w-4 h-4" />
                          Hide Product from Front End
                        </span>
                      ) : (
                        <span className="text-emerald-400 flex items-center gap-1.5">
                          <Eye className="w-4 h-4" />
                          Visible on Front End (Homepage)
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      {editForm.isHidden
                        ? "This product is hidden and will NOT be shown to customers on the homepage."
                        : "This product is visible and will be shown to customers on the homepage."}
                    </span>
                  </div>
                </label>
              </div>

              {/* Delivery / Area Restrictions */}
              <DeliveryRestrictionSelector
                restrictionType={editForm.restrictionType}
                restrictedPincodes={editForm.restrictedPincodes}
                restrictedLocations={editForm.restrictedLocations}
                onChange={(restrictionData) => {
                  setEditForm((prev) => ({
                    ...prev,
                    ...restrictionData,
                  }));
                }}
              />

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
