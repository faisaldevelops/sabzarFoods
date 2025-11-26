import { useState } from "react";
import { motion } from "framer-motion";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import axios from "../lib/axios";
import PhoneAuthModal from "./PhoneAuthModal";
import AddressSelectionModal from "./AddressSelectionModal";

const BuyNowModal = ({ isOpen, onClose, product }) => {
  const [quantity, setQuantity] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const { user } = useUserStore();

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
    if (!user) {
      // Show phone auth modal
      setShowPhoneAuth(true);
      return;
    }

    // User is authenticated, show address selection modal
    setShowAddressSelection(true);
  };

  const handleAuthSuccess = async () => {
    // Close phone auth modal and immediately open address selection
    setShowPhoneAuth(false);
    setShowAddressSelection(true);
  };

  const handleAddressSelected = (address) => {
    // Proceed to payment with selected address
    handlePayment(address);
  };

  const handlePayment = async (address) => {
    if (!address) return toast.error("Please add/select an address");

    setIsProcessing(true);
    try {
      // Create order with single product
      const orderProducts = [{
        product: product._id,
        quantity: quantity,
        price: product.price
      }];

      const res = await axios.post("/payments/razorpay-create-order", {
        products: orderProducts.map(item => ({
          ...item,
          _id: item.product,
          name: product.name,
          image: product.image
        })),
        address: address,
      });

      const { orderId, amount, currency, keyId, localOrderId } = res.data;

      // dynamically load Razorpay script (if not loaded)
      const rzpScriptLoaded = await new Promise((resolve) => {
        if (window.Razorpay) return resolve(true);
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!rzpScriptLoaded) {
        toast.error("Failed to load Razorpay SDK");
        setIsProcessing(false);
        return;
      }

      const options = {
        key: keyId,
        amount: amount,
        currency: currency || "INR",
        name: "Your Shop Name",
        description: "Order Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post("/payments/razorpay-verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              localOrderId,
            });

            if (verifyRes.data?.success) {
              toast.success("Payment successful!");
              window.location.href = `/purchase-success?orderId=${encodeURIComponent(orderId)}`;
            } else {
              toast.error(verifyRes.data?.message || "Verification failed");
            }
          } catch (err) {
            console.error("verify error", err);
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setIsProcessing(false);
            onClose();
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
          contact: user?.phoneNumber || "",
        },
        theme: {
          color: "#44403c",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to create order");
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setIsProcessing(false);
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
              disabled={isProcessing}
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
                ${product.price}
              </p>
              <p className="text-sm text-stone-600 mt-1">
                {product.stockQuantity} in stock
              </p>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDecrement}
                disabled={quantity <= 1 || isProcessing}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-300 bg-white text-stone-900 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Minus size={16} />
              </button>
              <span className="text-xl font-semibold text-stone-900 w-12 text-center">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                disabled={quantity >= product.stockQuantity || isProcessing}
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
            disabled={isProcessing}
            className="w-full rounded-md bg-stone-800 px-6 py-3 text-sm font-medium text-white hover:bg-stone-700 hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: isProcessing ? 1 : 1.02 }}
            whileTap={{ scale: isProcessing ? 1 : 0.98 }}
          >
            {isProcessing ? (
              "Processing..."
            ) : (
              <>
                <ShoppingBag size={16} />
                Proceed to Buy
              </>
            )}
          </motion.button>
        </motion.div>
      </div>

      <PhoneAuthModal 
        isOpen={showPhoneAuth} 
        onClose={() => setShowPhoneAuth(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <AddressSelectionModal
        isOpen={showAddressSelection}
        onClose={() => setShowAddressSelection(false)}
        onSelectAddress={handleAddressSelected}
      />
    </>
  );
};

export default BuyNowModal;
