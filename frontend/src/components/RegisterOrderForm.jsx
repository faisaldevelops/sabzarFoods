import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  MessageSquare,
  CreditCard,
  Truck,
  CheckCircle,
  Search,
  Loader
} from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ORDER_SOURCES = [
  { value: "whatsapp", label: "WhatsApp", icon: "💬" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "phone", label: "Phone Call", icon: "📞" },
  { value: "other", label: "Other", icon: "📝" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cod", label: "Cash on Delivery" },
];

const PAYMENT_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "cod", label: "COD (Pay on Delivery)" },
];

const RegisterOrderForm = () => {
  const { products, fetchAllProducts } = useProductStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    orderSource: "whatsapp",
    paymentMethod: "cash",
    paymentStatus: "paid",
    deliveryFee: 0,
    platformFee: 0,
    adminNotes: "",
    address: {
      houseNumber: "",
      streetAddress: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // Clear field error when user types
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Filter products based on search query
  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleAddProduct = (product) => {
    const existing = selectedProducts.find(p => p.productId === product._id);
    if (existing) {
      setSelectedProducts(prev =>
        prev.map(p =>
          p.productId === product._id
            ? { ...p, quantity: Math.min(p.quantity + 1, product.stockQuantity) }
            : p
        )
      );
    } else {
      setSelectedProducts(prev => [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: product.price,
          actualPrice: product.actualPrice,
          image: product.image,
          quantity: 1,
          maxStock: product.stockQuantity,
        },
      ]);
    }
    setSearchQuery("");
    clearError('products');
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveProduct(productId);
      return;
    }
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId
          ? { ...p, quantity: Math.min(newQuantity, p.maxStock) }
          : p
      )
    );
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const calculateSubtotal = () => {
    return selectedProducts.reduce((sum, p) => sum + p.price * p.quantity, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + (formData.deliveryFee || 0) + (formData.platformFee || 0);
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Customer validation
    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }
    if (!formData.customerPhone || !/^\d{10}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = "Enter valid 10-digit phone";
    }
    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Enter valid email";
    }
    
    // Address validation
    if (!formData.address.pincode || !/^\d{6}$/.test(formData.address.pincode)) {
      newErrors.pincode = "Enter 6-digit pincode";
    }
    if (!formData.address.city.trim()) {
      newErrors.city = "City is required";
    }
    if (!formData.address.state.trim()) {
      newErrors.state = "State is required";
    }
    
    // Products validation
    if (selectedProducts.length === 0) {
      newErrors.products = "Add at least one product";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post("/orders/manual", {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        products: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
        })),
        address: {
          name: formData.customerName,
          phoneNumber: formData.customerPhone,
          ...formData.address,
        },
        orderSource: formData.orderSource,
        paymentMethod: formData.paymentMethod,
        paymentStatus: formData.paymentStatus,
        deliveryFee: formData.deliveryFee,
        platformFee: formData.platformFee,
        adminNotes: formData.adminNotes,
      });

      if (response.data.success) {
        setCreatedOrder(response.data.order);
        setShowSuccess(true);
        toast.success("Order registered successfully!");
        
        // Reset form
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          orderSource: "whatsapp",
          paymentMethod: "cash",
          paymentStatus: "paid",
          deliveryFee: 0,
          platformFee: 0,
          adminNotes: "",
          address: {
            houseNumber: "",
            streetAddress: "",
            landmark: "",
            city: "",
            state: "",
            pincode: "",
          },
        });
        setSelectedProducts([]);
        
        // Refresh products to update stock
        fetchAllProducts();
      }
    } catch (error) {
      console.error("Error creating manual order:", error);
      toast.error(error.response?.data?.message || "Failed to create order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSuccessState = () => {
    setShowSuccess(false);
    setCreatedOrder(null);
  };

  // Success view
  if (showSuccess && createdOrder) {
    return (
      <motion.div
        className="bg-gray-800 rounded-lg p-8 max-w-2xl mx-auto text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">Order Registered!</h2>
        <p className="text-gray-400 mb-6">Order ID: <span className="text-emerald-400 font-mono">{createdOrder.publicOrderId}</span></p>
        
        <div className="bg-gray-900 rounded-lg p-4 text-left mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Customer:</span>
              <p className="text-white">{createdOrder.customer.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Phone:</span>
              <p className="text-white">{createdOrder.customer.phone}</p>
            </div>
            <div>
              <span className="text-gray-500">Source:</span>
              <p className="text-white capitalize">{createdOrder.orderSource}</p>
            </div>
            <div>
              <span className="text-gray-500">Payment:</span>
              <p className="text-white capitalize">{createdOrder.paymentMethod} ({createdOrder.paymentStatus})</p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Total Amount:</span>
              <p className="text-emerald-400 text-xl font-bold">₹{createdOrder.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <button
          onClick={resetSuccessState}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Register Another Order
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-semibold text-emerald-400 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Register Manual Order
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Customer Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => {
                  setFormData({ ...formData, customerName: e.target.value });
                  clearError('customerName');
                }}
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.customerName ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="Customer name"
              />
              {errors.customerName && <p className="text-xs text-red-400 mt-1">{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setFormData({ ...formData, customerPhone: digits });
                    clearError('customerPhone');
                  }}
                  className={`w-full bg-gray-700 border rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.customerPhone ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="10 digit phone"
                />
              </div>
              {errors.customerPhone && <p className="text-xs text-red-400 mt-1">{errors.customerPhone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => {
                    setFormData({ ...formData, customerEmail: e.target.value });
                    clearError('customerEmail');
                  }}
                  className={`w-full bg-gray-700 border rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.customerEmail ? 'border-red-500' : 'border-gray-600'}`}
                  placeholder="Email (optional)"
                />
              </div>
              {errors.customerEmail && <p className="text-xs text-red-400 mt-1">{errors.customerEmail}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Delivery Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">House/Flat No.</label>
              <input
                type="text"
                value={formData.address.houseNumber}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, houseNumber: e.target.value } })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="House/Flat number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.address.streetAddress}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, streetAddress: e.target.value } })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Landmark</label>
              <input
                type="text"
                value={formData.address.landmark}
                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, landmark: e.target.value } })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Landmark (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Pincode <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.address.pincode}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setFormData({ ...formData, address: { ...formData.address, pincode: digits } });
                  clearError('pincode');
                }}
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.pincode ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="6 digit pincode"
              />
              {errors.pincode && <p className="text-xs text-red-400 mt-1">{errors.pincode}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                City <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => {
                  setFormData({ ...formData, address: { ...formData.address, city: e.target.value } });
                  clearError('city');
                }}
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.city ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="City"
              />
              {errors.city && <p className="text-xs text-red-400 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                State <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => {
                  setFormData({ ...formData, address: { ...formData.address, state: e.target.value } });
                  clearError('state');
                }}
                className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${errors.state ? 'border-red-500' : 'border-gray-600'}`}
                placeholder="State"
              />
              {errors.state && <p className="text-xs text-red-400 mt-1">{errors.state}</p>}
            </div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Products <span className="text-red-400">*</span>
            </h3>
            {errors.products && <p className="text-xs text-red-400">{errors.products}</p>}
          </div>
          
          {/* Product Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Search products to add..."
            />
            
            {/* Search Results Dropdown */}
            {searchQuery && (
              <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-gray-400 text-center">No products found</div>
                ) : (
                  filteredProducts.slice(0, 10).map(product => (
                    <button
                      key={product._id}
                      type="button"
                      onClick={() => handleAddProduct(product)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-600 transition-colors text-left"
                    >
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{product.name}</p>
                        <p className="text-emerald-400 text-sm font-medium">₹{product.price}</p>
                      </div>
                      <span className="text-xs text-gray-400">{product.stockQuantity} in stock</span>
                      <Plus className="w-5 h-5 text-emerald-400" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Products */}
          <div className="space-y-2">
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No products added yet. Search and add products above.</p>
            ) : (
              selectedProducts.map(product => (
                <div key={product.productId} className="flex items-center gap-3 bg-gray-800 rounded-lg p-3">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{product.name}</p>
                    <div className="flex items-center gap-2">
                      {product.actualPrice && product.actualPrice > product.price && (
                        <span className="text-gray-500 text-xs line-through">₹{product.actualPrice}</span>
                      )}
                      <span className="text-emerald-400 text-sm">₹{product.price}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(product.productId, product.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                    >
                      <Minus className="w-4 h-4 text-white" />
                    </button>
                    <span className="w-8 text-center text-white font-medium">{product.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(product.productId, product.quantity + 1)}
                      disabled={product.quantity >= product.maxStock}
                      className="w-8 h-8 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded transition-colors disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-white font-medium w-20 text-right">
                    ₹{(product.price * product.quantity).toFixed(2)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(product.productId)}
                    className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Order Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Order Source</label>
              <select
                value={formData.orderSource}
                onChange={(e) => setFormData({ ...formData, orderSource: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {ORDER_SOURCES.map(source => (
                  <option key={source.value} value={source.value}>
                    {source.icon} {source.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Payment Status</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {PAYMENT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Delivery Fee</label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.deliveryFee}
                  onChange={(e) => setFormData({ ...formData, deliveryFee: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-md pl-10 pr-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Notes</label>
            <textarea
              value={formData.adminNotes}
              onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows="2"
              placeholder="Any notes about this order (e.g., special instructions, customer request, etc.)"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-300">
              <span>Subtotal ({selectedProducts.reduce((sum, p) => sum + p.quantity, 0)} items)</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Delivery Fee</span>
              <span>₹{(formData.deliveryFee || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-300">
              <span>Platform Fee</span>
              <span>₹{(formData.platformFee || 0).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 flex justify-between text-lg font-bold text-white">
              <span>Total</span>
              <span className="text-emerald-400">₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || selectedProducts.length === 0}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Creating Order...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              Register Order
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default RegisterOrderForm;

