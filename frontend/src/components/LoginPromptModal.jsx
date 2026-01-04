import { motion } from "framer-motion";
import { X, User } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

const LoginPromptModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError, 
  isLoading = false,
  title = "Sign in to continue",
  description = "Please sign in with your Google account to complete your order."
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-sm rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100">
              <User className="h-5 w-5 text-stone-600" />
            </div>
            <h3 className="text-lg font-semibold text-stone-900">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-900 p-1 -mr-1"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-stone-600 mb-6">
          {description}
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="w-6 h-6 border-2 border-stone-800 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-stone-600">Signing in...</span>
          </div>
        ) : (
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={onSuccess}
              onError={onError}
              theme="outline"
              size="large"
              text="continue_with"
              shape="rectangular"
              width="100%"
            />
          </div>
        )}

        <p className="text-xs text-stone-500 text-center mt-4">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPromptModal;

