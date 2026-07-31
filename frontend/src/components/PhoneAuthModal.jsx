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
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");
  const { checkAuth } = useUserStore();
  const { fetchAddresses } = useAddressStore();
  const { syncGuestCart } = useCartStore();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setPhoneError("");
    
    if (!/^\d{10}$/.test(phoneNumber)) {
      setPhoneError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/otp/send", { phoneNumber });
      setOtpSuccess("OTP sent successfully");
      
      setStep("otp");
      setResendCooldown(60);
      
      // Clear success message after 3 seconds
      setTimeout(() => setOtpSuccess(""), 3000);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.reason === "frozen") {
        setPhoneError(errorData.message);
      } else {
        setPhoneError(errorData?.message || "Failed to send OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) {
      return;
    }

    setResendLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const response = await axios.post("/otp/resend", { phoneNumber });
      setOtpSuccess("OTP resent successfully");
      
      if (response.data.otp) {
        toast.success(`Dev Mode - OTP: ${response.data.otp}`, { duration: 10000 });
      }
      
      setResendCooldown(60);
      
      // Clear success message after 3 seconds
      setTimeout(() => setOtpSuccess(""), 3000);
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.reason === "cooldown" && errorData?.waitTime) {
        setOtpError(`Please wait ${errorData.waitTime} seconds before resending`);
      } else if (errorData?.reason === "limit_reached" && errorData?.resetInMinutes) {
        setOtpError(`Too many attempts. Try again in ${errorData.resetInMinutes} minute(s)`);
      } else {
        setOtpError(errorData?.message || "Failed to resend OTP");
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
    setOtpError("");
    setOtpSuccess("");
    
    if (!otp || otp.length !== 4) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/otp/verify", {
        phoneNumber,
        otp,
      });
      
      setOtpSuccess(response.data.message);
      
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
      const errorData = error.response?.data;
      if (errorData?.reason === "frozen") {
        setOtpError(errorData.message);
      } else if (errorData?.remainingAttempts !== undefined) {
        setOtpError(`Invalid OTP. ${errorData.remainingAttempts} attempt(s) remaining`);
      } else {
        setOtpError(errorData?.message || "Failed to verify OTP");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("phone");
    setPhoneNumber("");
    setOtp("");
    setLoading(false);
    setResendCooldown(0);
    setPhoneError("");
    setOtpError("");
    setOtpSuccess("");
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
        className="relative z-10 w-full max-w-md rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-2xl font-semibold text-stone-900">
            {step === "phone" ? "Login / Sign Up" : "Verify OTP"}
          </h3>
          <button
            onClick={handleClose}
            className="text-stone-600 hover:text-stone-900"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                WhatsApp Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value.replace(/\D/g, "").slice(0, 10));
                    setPhoneError("");
                  }}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full rounded-md border px-10 py-2.5 focus:ring-2 focus:border-transparent ${phoneError ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : 'border-stone-300 bg-white text-stone-900 focus:ring-stone-800'}`}
                  required
                  disabled={loading}
                />
              </div>
              {phoneError && (
                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
              )}
            </div>

            <motion.button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#20bd5a] focus:outline-none focus:ring-4 focus:ring-[#25D366]/30 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {loading ? "Sending..." : "Send OTP via WhatsApp"}
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <span className="flex items-center gap-1">
                  Enter OTP sent to +91{phoneNumber}
                  <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400" size={20} />
                <input
                  type="text"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setOtp(value);
                    setOtpError("");
                    setOtpSuccess("");
                  }}
                  placeholder="Enter 4-digit OTP"
                  className={`w-full rounded-md border px-10 py-2.5 text-center text-2xl tracking-widest focus:ring-2 focus:border-transparent ${otpError ? 'border-red-500 bg-red-50 text-red-900 focus:ring-red-500' : otpSuccess ? 'border-green-500 bg-green-50 text-green-900 focus:ring-green-500' : 'border-stone-300 bg-white text-stone-900 focus:ring-stone-800'}`}
                  required
                  disabled={loading}
                  maxLength={4}
                />
              </div>
              {otpError && (
                <p className="mt-1 text-xs text-red-600">{otpError}</p>
              )}
              {otpSuccess && (
                <p className="mt-1 text-xs text-green-600">{otpSuccess}</p>
              )}
            </div>

            <motion.button
              type="submit"
              className="w-full rounded-lg bg-stone-800 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 focus:outline-none focus:ring-4 focus:ring-stone-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  setOtpError("");
                  setOtpSuccess("");
                }}
                className="text-sm text-stone-800 hover:text-stone-700"
                disabled={loading || resendLoading}
              >
                Change phone number
              </button>

              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-stone-800 hover:text-stone-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
