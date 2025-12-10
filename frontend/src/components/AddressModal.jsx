import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar Islands",
  "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi",
  "Jammu & Kashmir", "Ladakh", "Lakshadweep",
];

const emptyAddress = {
  name: "",
  phoneNumber: "",
  email: "",
  pincode: "",
  houseNumber: "",
  streetAddress: "",
  landmark: "",
  city: "",
  state: "",
};

const AddressModal = ({ isOpen, onClose, onSave, initial = null }) => {
  const [form, setForm] = useState(initial ?? emptyAddress);
  const [errors, setErrors] = useState({});
  const [pincodeLoading, setPincodeLoading] = useState(false);

  useEffect(() => {
    setForm(initial ?? emptyAddress);
    setErrors({});
  }, [initial, isOpen]);

  // Fetch city and state from pincode
  const fetchPincodeDetails = async (pincode) => {
    if (!/^\d{6}$/.test(pincode)) return;
    
    setPincodeLoading(true);
    try {
      // Using India Post API
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();
      
      if (data && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setForm((s) => ({
          ...s,
          city: postOffice.District || s.city,
          state: postOffice.State || s.state,
        }));
        // Clear any previous errors for city and state
        setErrors((e) => {
          const newErrors = { ...e };
          delete newErrors.city;
          delete newErrors.state;
          return newErrors;
        });
      }
    } catch (error) {
      console.error("Error fetching pincode details:", error);
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "phoneNumber") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((s) => ({ ...s, [name]: digits }));
      return;
    }
    if (name === "pincode") {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      setForm((s) => ({ ...s, [name]: digits }));
      // Auto-fetch city and state when pincode is 6 digits
      if (digits.length === 6) {
        fetchPincodeDetails(digits);
      }
      return;
    }
    setForm((s) => ({ ...s, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!/^\d{10}$/.test(form.phoneNumber)) e.phoneNumber = "Enter 10 digit phone";
    // Email is optional, but if provided, validate format
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = "Enter valid email";
    }
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter 6 digit pincode";
    if (!form.houseNumber.trim()) e.houseNumber = "House number required";
    if (!form.streetAddress.trim()) e.streetAddress = "Street address required";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "Select a state";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave?.(form);
    onClose?.();
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
        className="relative z-10 w-full max-w-lg rounded-lg border border-stone-200 bg-white p-6 shadow-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-stone-900">Add Address</h3>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-stone-700">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
              placeholder="Full name"
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-stone-700">Phone</label>
              <input
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                inputMode="numeric"
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
                placeholder="10 digits"
              />
              {errors.phoneNumber && <p className="text-xs text-red-600">{errors.phoneNumber}</p>}
            </div>
            <div>
              <label className="text-sm text-stone-700">Email (optional)</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
                placeholder="Optional"
              />
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-stone-700">Pincode</label>
            <input
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              inputMode="numeric"
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
              placeholder="6 digits"
            />
            {pincodeLoading && <p className="text-xs text-blue-600 mt-1">Fetching location details...</p>}
            {errors.pincode && <p className="text-xs text-red-600">{errors.pincode}</p>}
          </div>

          <div>
            <label className="text-sm text-stone-700">House / Flat no.</label>
            <input
              name="houseNumber"
              value={form.houseNumber}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
            {errors.houseNumber && <p className="text-xs text-red-600">{errors.houseNumber}</p>}
          </div>

          <div>
            <label className="text-sm text-stone-700">Street Address</label>
            <input
              name="streetAddress"
              value={form.streetAddress}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
            {errors.streetAddress && <p className="text-xs text-red-600">{errors.streetAddress}</p>}
          </div>

          <div>
            <label className="text-sm text-stone-700">Landmark (optional)</label>
            <input
              name="landmark"
              value={form.landmark}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-stone-700">City</label>
              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
              />
              {errors.city && <p className="text-xs text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label className="text-sm text-stone-700">State</label>
              <select
                name="state"
                value={form.state}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:ring-2 focus:ring-stone-800 focus:border-transparent"
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              {errors.state && <p className="text-xs text-red-600">{errors.state}</p>}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              className="rounded-lg bg-stone-800 px-4 py-2 text-sm text-white hover:bg-stone-700 focus:ring-4 focus:ring-stone-300"
            >
              Save Address
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AddressModal;
