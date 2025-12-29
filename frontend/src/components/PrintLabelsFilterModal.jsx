import { motion } from "framer-motion";
import { X, Printer } from "lucide-react";
import { useState } from "react";

const PrintLabelsFilterModal = ({ isOpen, onClose, onConfirm }) => {
    const [filters, setFilters] = useState({
        status: 'processing',
        deliveryType: 'all'
    });

    if (!isOpen) return null;

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleConfirm = () => {
        onConfirm(filters);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Printer className="w-5 h-5" />
                        Print Labels - Select Filters
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Order Status
                        </label>
                        <select
                            value={filters.status}
                            onChange={(e) => handleFilterChange('status', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="pending">Payment pending</option>
                            <option value="processing">Processing</option>
                            <option value="ready">Ready</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    {/* Delivery Type Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Delivery Type
                        </label>
                        <select
                            value={filters.deliveryType}
                            onChange={(e) => handleFilterChange('deliveryType', e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All (Local + National)</option>
                            <option value="local">Local Only</option>
                            <option value="national">National Only</option>
                        </select>
                    </div>

                    <div className="bg-gray-700 rounded-md p-3 mt-4">
                        <p className="text-sm text-gray-300">
                            <span className="font-semibold">Note:</span> Labels will be sorted with older orders on top. 
                            Order items will be displayed above each label.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                        <Printer className="w-4 h-4" />
                        Print Labels
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default PrintLabelsFilterModal;
