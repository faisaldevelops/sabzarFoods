import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Minus, ShoppingBag, Bell, Search } from "lucide-react";

const InsufficientStockModal = ({ 
  isOpen, 
  onClose, 
  insufficientItems = [], 
  onReduceQuantity,
  onBrowseSimilar,
  onJoinWaitlist 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative z-10 w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl mx-4"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-900">
                  Stock Unavailable
                </h3>
                <p className="text-sm text-stone-500">
                  Some items are no longer available
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Insufficient Items List */}
          <div className="mb-6 space-y-3 max-h-48 overflow-y-auto">
            {insufficientItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 p-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-stone-900 text-sm">
                    {item.name || "Product"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-stone-500">
                      Requested: {item.requested}
                    </span>
                    <span className="text-xs text-stone-400">•</span>
                    <span className="text-xs text-amber-600 font-medium">
                      Available: {item.available}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Reduce Quantity Option */}
            {insufficientItems.some(item => item.available > 0) && (
              <motion.button
                onClick={() => onReduceQuantity && onReduceQuantity(insufficientItems)}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-stone-800 px-4 py-3 text-sm font-medium text-white hover:bg-stone-700 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Minus size={16} />
                Reduce to Available Quantity
              </motion.button>
            )}

            {/* Join Waitlist Option */}
            <motion.button
              onClick={() => onJoinWaitlist && onJoinWaitlist(insufficientItems)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 hover:bg-stone-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Bell size={16} />
              Notify When Available
            </motion.button>

            {/* Browse Similar Items */}
            <motion.button
              onClick={() => onBrowseSimilar && onBrowseSimilar(insufficientItems)}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-medium text-stone-900 hover:bg-stone-50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Search size={16} />
              Browse Similar Items
            </motion.button>

            {/* Continue Shopping */}
            <motion.button
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-stone-500 hover:text-stone-700 py-2 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ShoppingBag size={16} />
              Continue Shopping
            </motion.button>
          </div>

          {/* Info Text */}
          <p className="mt-4 text-center text-xs text-stone-400">
            During checkout, items are reserved for 15 minutes to ensure availability.
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InsufficientStockModal;
