import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Printer, 
  CheckCircle, 
  Package, 
  MapPin, 
  RefreshCw,
  Filter,
  CheckSquare,
  Square,
  Truck,
  Clock,
  Download,
  FileText
} from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const LabelsTab = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [filter, setFilter] = useState({
    status: "processing",
    printed: "unprinted"
  });
  const [counts, setCounts] = useState({ total: 0, local: 0, national: 0 });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.printed) params.append("printed", filter.printed);
      
      const response = await axios.get(`/orders/labels?${params.toString()}`);
      
      if (response.data.success) {
        setOrders(response.data.data);
        setCounts(response.data.counts);
      }
    } catch (error) {
      console.error("Error fetching orders for labels:", error);
      toast.error("Failed to fetch orders");
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.orderId));
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => 
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handlePrintAndMark = async () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order to print");
      return;
    }

    setIsPrinting(true);

    try {
      // Open print window with ONLY selected order IDs
      const baseURL = import.meta.env.VITE_API_URL || '';
      const params = new URLSearchParams();
      
      // Pass selected order IDs to print only those
      params.append("orderIds", selectedOrders.join(','));
      
      const url = `${baseURL}/orders/bulk-address-sheets?${params.toString()}`;
      window.open(url, '_blank');

      // Mark as printed
      const response = await axios.post("/orders/labels/mark-printed", {
        orderIds: selectedOrders
      });

      if (response.data.success) {
        toast.success(`${response.data.modifiedCount} labels marked as printed`);
        setSelectedOrders([]);
        fetchOrders(); // Refresh list
      }
    } catch (error) {
      console.error("Error printing labels:", error);
      toast.error("Failed to mark labels as printed");
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintOnly = () => {
    // Just print without marking
    const baseURL = import.meta.env.VITE_API_URL || '';
    const params = new URLSearchParams();
    
    // If orders are selected, print only those; otherwise use filter
    if (selectedOrders.length > 0) {
      params.append("orderIds", selectedOrders.join(','));
    } else {
      params.append("status", filter.status);
    }
    
    const url = `${baseURL}/orders/bulk-address-sheets?${params.toString()}`;
    window.open(url, '_blank');
  };

  const handleDownloadSummary = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.status) params.append('status', filter.status);
      if (filter.printed) params.append('printed', filter.printed);
      
      const response = await axios.get(`/orders/labels/summary-csv?${params.toString()}`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `labels-summary-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Summary downloaded successfully');
    } catch (error) {
      console.error('Error downloading summary:', error);
      toast.error('Failed to download summary');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="text-2xl font-bold text-white">{counts.total}</p>
              <p className="text-sm text-gray-400">Total Orders</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.local}</p>
              <p className="text-sm text-gray-400">Local Delivery</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{counts.national}</p>
              <p className="text-sm text-gray-400">National Delivery</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{selectedOrders.length}</p>
              <p className="text-sm text-gray-400">Selected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-300">Filters:</span>
          </div>
          
          <select
            value={filter.status}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white"
          >
            <option value="processing">Processing</option>
            <option value="ready">Ready to Ship</option>
            <option value="all">All Statuses</option>
          </select>

          <select
            value={filter.printed}
            onChange={(e) => setFilter(prev => ({ ...prev, printed: e.target.value }))}
            className="bg-gray-700 border border-gray-600 rounded-md px-3 py-1.5 text-sm text-white"
          >
            <option value="unprinted">Not Printed Yet</option>
            <option value="printed">Already Printed</option>
            <option value="all">All</option>
          </select>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white transition-colors"
        >
          {selectedOrders.length === orders.length && orders.length > 0 ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {selectedOrders.length === orders.length && orders.length > 0 ? "Deselect All" : "Select All"}
        </button>

        <motion.button
          onClick={handlePrintAndMark}
          disabled={selectedOrders.length === 0 || isPrinting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-md text-sm text-white font-medium transition-colors"
          whileHover={{ scale: selectedOrders.length > 0 ? 1.02 : 1 }}
          whileTap={{ scale: selectedOrders.length > 0 ? 0.98 : 1 }}
        >
          <Printer className="w-4 h-4" />
          {isPrinting ? "Printing..." : `Print & Mark as Printed (${selectedOrders.length})`}
        </motion.button>

        <button
          onClick={handlePrintOnly}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print Preview Only
        </button>

        <button
          onClick={handleDownloadSummary}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-sm text-white transition-colors"
          title="Download a CSV summary to double-check labels"
        >
          <FileText className="w-4 h-4" />
          Download Summary
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <p className="text-white font-medium">No orders to print!</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter.printed === "unprinted" 
              ? "All labels have been printed." 
              : "No orders match the current filters."}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">
                  <button onClick={handleSelectAll} className="hover:text-white">
                    {selectedOrders.length === orders.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Items</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order) => (
                <tr 
                  key={order.orderId}
                  className={`hover:bg-gray-700/50 transition-colors ${
                    selectedOrders.includes(order.orderId) ? 'bg-emerald-900/20' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleSelectOrder(order.orderId)}
                      className="text-gray-400 hover:text-white"
                    >
                      {selectedOrders.includes(order.orderId) ? (
                        <CheckSquare className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white font-bold ${
                      order.deliveryType === 'local' ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      {order.sequenceNumber}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-mono text-sm">{order.publicOrderId}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white font-medium">{order.customer.name}</p>
                      <p className="text-xs text-gray-400">{order.customer.city}, {order.customer.state}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      {order.products.slice(0, 2).map((product, idx) => (
                        <p key={idx} className="text-sm text-gray-300">
                          {product.name} × {product.quantity}
                        </p>
                      ))}
                      {order.products.length > 2 && (
                        <p className="text-xs text-gray-500">+{order.products.length - 2} more</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        order.deliveryType === 'local' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {order.deliveryType === 'local' ? '🏠 Local' : '🚚 National'}
                      </span>
                      {order.isManualOrder && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400">
                          {order.orderSource}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {order.labelPrintedAt ? (
                      <div className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">Printed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-green-500"></span>
          <span>Local Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-blue-500"></span>
          <span>National Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-orange-500/30"></span>
          <span>Manual Order</span>
        </div>
      </div>
    </div>
  );
};

export default LabelsTab;

