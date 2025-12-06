import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";
import PhoneAuthModal from "./PhoneAuthModal";

const BuyNowModal = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const { user } = useUserStore();
  const navigate = useNavigate();

  const handleIncrement = () => {
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

    if (!user) {
      // Show phone auth modal - user will be redirected after login
      setShowPhoneAuth(true);
      return;
    }

    // User is authenticated, navigate to order summary page
    handleClose();
    navigate("/order-summary");
  };

  const handleAuthSuccess = async () => {
    // Close phone auth modal and navigate to order summary page
    setShowPhoneAuth(false);
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
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
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
            <h3 className="text-2xl font-bold text-stone-900">
              Buy Now
            </h3>
            <button
              onClick={handleClose}
              className="text-stone-400 hover:text-stone-900"
              disabled={false}
            >
              <X size={20} />
            </button>
          </div>

          {/* Product Info */}
          <div className="mb-6 flex gap-4">
            <img 
              src={product.image} 
              alt={product.name}
              className="h-24 w-24 rounded-md object-cover border border-stone-200"
            />
            <div className="flex-1">
              <h4 className="font-medium text-stone-900 line-clamp-2">
                {product.name}
              </h4>
              <p className="text-lg font-bold text-stone-900 mt-1">
                ₹{product.price}
              </p>
              <p className="text-sm text-stone-600 mt-1">
                {product.stockQuantity} in stock
              </p>
            </div>
          </div>

          {/* Countdown Timer when hold is active */}

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-semibold text-stone-900 w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= product.stockQuantity}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Total */}
          <div className="mb-6 flex justify-between items-center py-3 border-t border-stone-200">
            <span className="text-lg font-medium text-stone-900">Total:</span>
            <span className="text-2xl font-bold text-stone-900">${totalPrice}</span>
          </div>

          {/* Proceed Button */}
          <motion.button
            onClick={handleProceed}
            disabled={false}
            className="w-full rounded-md bg-stone-800 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingBag size={16} />
            Proceed to Buy
          </motion.button>
        </motion.div>
      </div>

      <PhoneAuthModal 
        isOpen={showPhoneAuth} 
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
};

export default BuyNowModal;
