import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, MapPin, Plus } from "lucide-react";
import AddressModal from "./AddressModal";
import { useAddressStore } from "../stores/useAddressStore";

const AddressSelectionModal = ({ isOpen, onClose, onSelectAddress }) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const { address: storeAddresses, createAddress, loading } = useAddressStore();

  const handleSaveNewAddress = async (addr) => {
    try {
      await createAddress(addr);
      setShowAddressForm(false);
      // Select the newly added address (will be at the end)
      setSelectedAddressIndex(storeAddresses.length);
    } catch (error) {
      console.log("error creating address", error);
    }
  };

  const handleContinue = () => {
    if (storeAddresses && storeAddresses.length > 0) {
      onSelectAddress(storeAddresses[selectedAddressIndex]);
    }
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
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-emerald-400">Select Delivery Address</h3>
            <p className="text-sm text-gray-400 mt-1">
              Choose an address or add a new one
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Saved Addresses */}
          {storeAddresses && storeAddresses.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-300">Saved Addresses</h4>
              {storeAddresses.map((addr, index) => (
                <motion.div
                  key={index}
                  className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                    selectedAddressIndex === index
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-gray-700 bg-gray-900 hover:border-gray-600"
                  }`}
                  onClick={() => setSelectedAddressIndex(index)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {selectedAddressIndex === index && (
                    <div className="absolute top-3 right-3">
                      <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="text-emerald-400 mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {addr.name} • {addr.phoneNumber}
                      </p>
                      {addr.email && <p className="text-sm text-gray-400">{addr.email}</p>}
                      <p className="text-sm text-gray-300 mt-1">
                        {addr.houseNumber}, {addr.streetAddress}
                        {addr.landmark && `, ${addr.landmark}`}
                      </p>
                      <p className="text-sm text-gray-300">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Add New Address Button */}
          <motion.button
            onClick={() => setShowAddressForm(true)}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-600 bg-gray-900 px-5 py-4 text-sm font-medium text-gray-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Plus size={20} />
            Add New Address
          </motion.button>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
            <motion.button
              onClick={handleContinue}
              disabled={!storeAddresses || storeAddresses.length === 0}
              className="flex-1 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: storeAddresses && storeAddresses.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: storeAddresses && storeAddresses.length > 0 ? 0.98 : 1 }}
            >
              Continue to Payment
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Address Form Modal */}
      <AddressModal
        isOpen={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSave={handleSaveNewAddress}
        loading={loading}
      />
    </div>
  );
};

export default AddressSelectionModal;
