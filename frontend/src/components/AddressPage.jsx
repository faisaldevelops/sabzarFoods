import React, { useState } from "react";
import AddressModal from "./AddressModal";
import { motion } from "framer-motion";
import { MapPinPlus } from "lucide-react";
import { useAddressStore } from "../stores/useAddressStore";

const AddressPage = () => {
  const [open, setOpen] = useState(false);

  // use the store's address array and actions
  const { createAddress, loading, address: storeAddresses } = useAddressStore();

  // open modal, user saves -> handleSave called with `addr` object
  const handleSave = async (addr) => {
    try {
      // wait for store action to finish (and possibly update store.address)
      await createAddress(addr);

      // close the modal after successful save
      setOpen(false);
      // no need to set local addresses state — we rely on storeAddresses
    } catch (error) {
      console.log("error creating address", error);
      // error toast already shown by store; optionally handle UI here
    }
  };

  return (
    <motion.div
      className="space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* ADDRESS PRINTING GOES HERE */}
      <div className="mt-4 space-y-2">
        {Array.isArray(storeAddresses) && storeAddresses.length > 0 ? (
          storeAddresses.map((a, i) => (
            <div key={i} className="rounded-md border border-gray-700 bg-gray-800 p-3 text-white">
              <p className="font-medium">
                {a.name} • {a.phoneNumber}
              </p>
              {a.email && <p className="text-sm text-gray-400">{a.email}</p>}
              <p className="text-sm text-gray-300">
                {a.houseNumber}, {a.streetAddress}, {a.city}, {a.state} - {a.pincode}
              </p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-400">No addresses yet</p>
        )}
      </div>

      <motion.button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MapPinPlus />
        &nbsp;&nbsp;Add Address
      </motion.button>

      <AddressModal isOpen={open} onClose={() => setOpen(false)} onSave={handleSave} loading={loading} />
    </motion.div>
  );
};

export default AddressPage;
