import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Phone, KeyRound } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";
import { useAddressStore } from "../stores/useAddressStore";
import { useCartStore } from "../stores/useCartStore";

const PhoneAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState("phone"); // "phone" or "otp"
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const { checkAuth } = useUserStore();
  const { fetchAddresses } = useAddressStore();
  const { syncGuestCart } = useCartStore();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/otp/send", { phoneNumber });
      toast.success(response.data.message);
      
      // In development, show OTP in toast
      // if (response.data.otp) {
      //   toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
      // }
      
      setStep("otp");
      setResendCooldown(30); // Start 30-second cooldown
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    try {
      const response = await axios.post("/otp/resend", { phoneNumber });
      toast.success(response.data.message);
      
      // In development, show OTP in toast
      if (response.data.otp) {
        toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
      }
      
      setResendCooldown(30); // Reset 30-second cooldown
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.reason === "cooldown" && errorData?.waitTime) {
        toast.error(`Please wait ${errorData.waitTime} seconds before resending`);
      } else if (errorData?.reason === "limit_reached" && errorData?.resetInMinutes) {
        toast.error(`Too many attempts. Try again in ${errorData.resetInMinutes} minute(s)`);
      } else {
        toast.error(errorData?.message || "Failed to resend OTP");
      }
    } finally {
      setResendLoading(false);
    }
  };

  // Countdown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/otp/verify", {
        phoneNumber,
        otp,
        name: name || "User", // Default name if not provided
      });
      
      toast.success(response.data.message);
      
      // Refresh auth state
      await checkAuth();
      
      // Sync guest cart to database after successful authentication
      await syncGuestCart();
      
      // Fetch addresses for the logged-in user
      await fetchAddresses();
      
      // Call success callback BEFORE closing modal
      if (onSuccess) {
        await onSuccess(response.data);
      }
      
      // Close modal after callback is done
      handleClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setName("");
    setLoading(false);
    setResendCooldown(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-2xl font-semibold text-emerald-400">
            {step === "phone" ? "Login / Sign Up" : "Verify OTP"}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-300 hover:text-white"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-10 py-2.5 text-white focus:ring-2 focus:ring-emerald-300"
                  required
                  disabled={loading}
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                We'll send you a verification code
              </p>
            </div>

            <motion.button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter OTP sent to +91{phoneNumber}
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  className="w-full rounded-md border border-gray-700 bg-gray-900 px-10 py-2.5 text-white focus:ring-2 focus:ring-emerald-300 text-center text-2xl tracking-widest"
                  required
                  disabled={loading}
                  maxLength={6}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name (optional for returning users)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-md border border-gray-700 bg-gray-900 px-4 py-2.5 text-white focus:ring-2 focus:ring-emerald-300"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                Required for new users only
              </p>
            </div>

            <motion.button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify & Continue"}
            </motion.button>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setResendCooldown(0);
                }}
                className="text-sm text-emerald-400 hover:text-emerald-300"
                disabled={loading || resendLoading}
              >
                Change phone number
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-emerald-400 hover:text-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || resendLoading || resendCooldown > 0}
              >
                {resendLoading ? (
                  "Sending..."
                ) : resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  "Resend Code"
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default PhoneAuthModal;
