import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const MAX_QUANTITY_PER_ITEM = 5;

const BuyNowModal = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const navigate = useNavigate();

  const handleIncrement = () => {
    if (quantity >= MAX_QUANTITY_PER_ITEM) {
      toast.error(`Maximum quantity of ${MAX_QUANTITY_PER_ITEM} per item allowed`);
      return;
    }
    if (quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    } else {
      toast.error(`Only ${product.stockQuantity} items available`);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleProceed = () => {
    // Store pending order data
    const orderData = {
      product,
      quantity,
    };
    localStorage.setItem("pendingBuyNowOrder", JSON.stringify(orderData));

    // Navigate to order summary - sign-in happens inline there if needed
    handleClose();
    navigate("/order-summary");
  };

  const handleClose = () => {
    setQuantity(1);
    onClose();
  };

  if (!isOpen || !product) return null;

  const totalPrice = (product.price * quantity).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-xl font-bold text-stone-900">
            Buy Now
          </h3>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-900"
          >
            <X size={20} />
          </button>
        </div>

        {/* Product Info */}
        <div className="mb-5 flex gap-4">
          <img 
            src={product.image} 
            alt={product.name}
            className="h-20 w-20 rounded-md object-cover border border-stone-200"
          />
          <div className="flex-1">
            <h4 className="font-medium text-stone-900 line-clamp-2 text-sm">
              {product.name}
            </h4>
            <div className="flex items-baseline gap-2 mt-1">
              {product.actualPrice && product.actualPrice > product.price && (
                <span className="text-sm text-stone-400 line-through">
                  ₹{product.actualPrice}
                </span>
              )}
              <span className="text-lg font-bold text-stone-900">
                ₹{product.price}
              </span>
            </div>
          </div>
        </div>

        {/* Quantity Selector */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="text-lg font-semibold text-stone-900 w-10 text-center">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stockQuantity || quantity >= MAX_QUANTITY_PER_ITEM}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Total */}
        <div className="mb-5 flex justify-between items-center py-3 border-t border-stone-200">
          <span className="text-base font-medium text-stone-700">Total</span>
          <span className="text-xl font-bold text-stone-900">₹{totalPrice}</span>
        </div>

        {/* Proceed Button */}
        <motion.button
          onClick={handleProceed}
          className="w-full rounded-md bg-stone-800 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ShoppingBag size={16} />
          Proceed to Checkout
        </motion.button>
      </motion.div>
    </div>
  );
};

export default BuyNowModal;
