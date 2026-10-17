import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Info, MapPin, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { checkProductDeliverability, checkProductDeliverabilityAsync } from "../lib/deliveryValidation";

/**
 * DeliveryAreaModal
 * Opens when the 'i' button on a restricted product card is clicked.
 * Shows that the product is deliverable in selected regions only,
 * lists the allowed PIN codes and/or Districts, and includes an interactive PIN code checker.
 */
const DeliveryAreaModal = ({ isOpen, onClose, product }) => {
  const [testPincode, setTestPincode] = useState("");
  const [checkResult, setCheckResult] = useState(null);
  const [pinSearchQuery, setPinSearchQuery] = useState("");
  const [checkingPin, setCheckingPin] = useState(false);

  const restrictionType = product?.restrictionType;
  const restrictedPincodes = product?.restrictedPincodes || [];
  const restrictedLocations = product?.restrictedLocations || [];

  // Filter PIN codes list if customer uses the search filter - called unconditionally
  const filteredPins = useMemo(() => {
    if (!pinSearchQuery.trim()) return restrictedPincodes;
    return restrictedPincodes.filter((pin) =>
      String(pin).includes(pinSearchQuery.trim())
    );
  }, [restrictedPincodes, pinSearchQuery]);

  // Handle checking a user's PIN code
  const handleCheckPincode = async (e) => {
    e?.preventDefault();
    if (!product) return;
    const cleanPin = testPincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setCheckResult({
        checked: true,
        isDeliverable: false,
        message: "Please enter a valid 6-digit Indian PIN code.",
      });
      return;
    }

    setCheckingPin(true);
    try {
      const res = await checkProductDeliverabilityAsync(product, { pincode: cleanPin });
      const locText = res.locationInfo ? ` (${res.locationInfo.district}, ${res.locationInfo.state})` : "";
      if (res.isDeliverable) {
        setCheckResult({
          checked: true,
          isDeliverable: true,
          message: `✓ Great news! Delivery is available to PIN code ${cleanPin}${locText}.`,
        });
      } else {
        setCheckResult({
          checked: true,
          isDeliverable: false,
          message: `✕ Sorry, PIN code ${cleanPin}${locText} is not eligible for delivery. This product is deliverable in selected regions only.`,
        });
      }
    } catch {
      const res = checkProductDeliverability(product, { pincode: cleanPin });
      setCheckResult({
        checked: true,
        isDeliverable: res.isDeliverable,
        message: res.isDeliverable
          ? `✓ Great news! Delivery is available to PIN code ${cleanPin}.`
          : `✕ Sorry, PIN code ${cleanPin} is not eligible for delivery. This product is deliverable in selected regions only.`,
      });
    } finally {
      setCheckingPin(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Box */}
        <motion.div
          className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <div className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-100 bg-white/95 px-4 py-3.5 sm:px-5 sm:py-4 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <Info size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-stone-900 leading-tight">
                  Delivery Area Information
                </h3>
                <p className="text-xs text-stone-500">
                  Regional availability details
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Full Delivery Area View - identical on both mobile and desktop */}
          <div className="p-4 sm:p-5 space-y-4">
            {/* Product Summary */}
            <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3 border border-stone-200/60">
              <img
                src={product.image}
                alt={product.name}
                className="h-14 w-14 rounded-lg object-cover border border-stone-200 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-stone-900 truncate">
                  {product.name}
                </h4>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">
                  ₹{product.price}
                </p>
              </div>
            </div>

            {/* Main Restriction Notice */}
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-amber-900 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Info size={18} className="text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-950">
                    This product is deliverable in selected regions only.
                  </p>
                  <p className="text-xs text-amber-800/90 mt-1">
                    Due to freshness or regional sourcing, this item is not deliverable all over India. Please check if your PIN code or district is eligible below.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick PIN Code Availability Checker */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600">
                Check Your Delivery PIN Code
              </label>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin size={16} className="absolute left-3 top-2.5 text-stone-400" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN code"
                    value={testPincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setTestPincode(val);
                      if (checkResult) setCheckResult(null);
                    }}
                    className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3 py-2 text-sm text-stone-900 focus:border-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-800"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingPin}
                  className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60 transition"
                >
                  {checkingPin ? "Checking..." : "Check"}
                </button>
              </form>

              {/* Result banner */}
              {checkResult && (
                <div
                  className={`flex items-start gap-2 rounded-lg p-2.5 text-xs font-medium ${
                    checkResult.isDeliverable
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {checkResult.isDeliverable ? (
                    <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{checkResult.message}</span>
                </div>
              )}
            </div>

            {/* Allowed PIN Codes Section */}
            {(restrictionType === "pincodes" || restrictionType === "both") && restrictedPincodes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-600">
                    Eligible PIN Codes ({restrictedPincodes.length})
                  </span>
                  {restrictedPincodes.length > 10 && (
                    <div className="relative w-36">
                      <Search size={12} className="absolute left-2 top-2 text-stone-400" />
                      <input
                        type="text"
                        placeholder="Search PIN..."
                        value={pinSearchQuery}
                        onChange={(e) => setPinSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-stone-200 bg-stone-50 pl-6 pr-2 py-1 text-[11px] text-stone-800 focus:outline-none focus:border-stone-400"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-lg border border-stone-200 bg-stone-50/50 p-2.5">
                  {filteredPins.length > 0 ? (
                    filteredPins.map((pin) => (
                      <span
                        key={pin}
                        className="inline-block rounded-md bg-white border border-stone-300 px-2 py-1 text-xs font-mono font-medium text-stone-800 shadow-2xs"
                      >
                        {pin}
                      </span>
                    ))
                  ) : (
                    <p className="text-xs text-stone-500 py-1">No matching PIN codes found.</p>
                  )}
                </div>
              </div>
            )}

            {/* Allowed Districts / States Section */}
            {(restrictionType === "districts" || restrictionType === "both") && restrictedLocations.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-stone-600 block">
                  Eligible States & Districts
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {restrictedLocations.map((loc) => (
                    <div
                      key={loc.state}
                      className="rounded-lg border border-stone-200 bg-stone-50/50 p-3 text-xs"
                    >
                      <div className="flex items-center justify-between font-semibold text-stone-900 mb-1">
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-700" />
                          {loc.state}
                        </span>
                        <span className="text-[11px] font-normal text-stone-500 bg-white border border-stone-200 px-1.5 py-0.5 rounded">
                          {loc.districts?.length ? `${loc.districts.length} districts` : "All districts"}
                        </span>
                      </div>
                      <p className="text-stone-600 leading-relaxed text-[11px] pl-4">
                        {loc.districts && loc.districts.length > 0
                          ? loc.districts.join(", ")
                          : "All districts in this state"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-stone-100 bg-stone-50 px-5 py-3 flex justify-end">
            <button
              onClick={onClose}
              className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white hover:bg-stone-800 transition"
            >
              Understood
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);
};

export default DeliveryAreaModal;
