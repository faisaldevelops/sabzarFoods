import { motion } from "framer-motion";
import { Truck, Package, CheckCircle, XCircle, Search, Filter } from "lucide-react";
import axios from "../lib/axios";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

const OrderslistTab = () => {
    const [ orders, setOrders ] = useState([])
    const [isLoading, setIsLoading] = useState(true);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    // Store display IDs for orders
    // Filter states
    const [filters, setFilters] = useState({
        phoneNumber: '',
        orderId: '',
        status: 'all'
    });
    const [showFilters, setShowFilters] = useState(false);
    
    // Debounced filters for API calls
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    // Debounce filter changes to avoid excessive API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [filters]);

    useEffect(() => {
        const fetchAllOrders = async () => {
            try {
                setIsLoading(true);
                // Build query parameters
                const params = new URLSearchParams();
                if (debouncedFilters.phoneNumber) params.append('phoneNumber', debouncedFilters.phoneNumber);
                    if (debouncedFilters.orderId) params.append('publicOrderId', debouncedFilters.orderId);
                if (debouncedFilters.status && debouncedFilters.status !== 'all') params.append('status', debouncedFilters.status);
                const queryString = params.toString();
                const url = queryString ? `/orders?${queryString}` : '/orders';
                const response = await axios.get(url);
                const ordersData = response.data.data || [];
                setOrders(ordersData);
            } catch (error) {
                console.error("Error fetching orders data:", error);
                toast.error(error.response?.data?.message || "Failed to fetch orders");
            } finally {
                setIsLoading(false);
            }
        };
		fetchAllOrders();
	}, [debouncedFilters]);
// Removed duplicate/broken useEffect and setDisplayOrderIds calls

    const updateTrackingStatus = async (orderId, newStatus) => {
        setUpdatingOrder(orderId);
        try {
            const response = await axios.patch(`/orders/${orderId}/tracking`, {
                trackingStatus: newStatus,
                note: `Status updated to ${newStatus}`,
            });
            
            if (response.data.success) {
                // Update local state
                setOrders(prevOrders => 
                    prevOrders.map(order => 
                        order.orderId === orderId 
                            ? { ...order, trackingStatus: newStatus, trackingHistory: response.data.order.trackingHistory }
                            : order
                    )
                );
                toast.success("Order status updated successfully");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error(error.response?.data?.message || "Failed to update order status");
        } finally {
            setUpdatingOrder(null);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { color: "bg-yellow-500", icon: Package, text: "Pending" },
            processing: { color: "bg-blue-500", icon: Package, text: "Processing" },
            shipped: { color: "bg-purple-500", icon: Truck, text: "Shipped" },
            delivered: { color: "bg-green-500", icon: CheckCircle, text: "Delivered" },
            cancelled: { color: "bg-red-500", icon: XCircle, text: "Cancelled" },
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;
        
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
                <Icon className="w-3 h-3 mr-1" />
                {config.text}
            </span>
        );
    };

    if (isLoading) {
		return <div className="text-center text-gray-300 py-8">Loading...</div>;
	}
    
    const handleFilterChange = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleClearFilters = () => {
        setFilters({
            phoneNumber: '',
            orderId: '',
            status: 'all'
        });
    };

    return <>    
    {/* Filter Section */}
    <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Filter Orders</h3>
            </div>
            <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-emerald-400 hover:text-emerald-300"
            >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
        </div>
        
        {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Phone Number
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by phone..."
                            value={filters.phoneNumber}
                            onChange={(e) => handleFilterChange('phoneNumber', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Order ID
                    </label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order ID..."
                            value={filters.orderId}
                            onChange={(e) => handleFilterChange('orderId', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                    </label>
                    <select
                        value={filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
        )}
        
        {showFilters && (filters.phoneNumber || filters.orderId || filters.status !== 'all') && (
            <div className="mt-4 flex justify-end">
                <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm"
                >
                    Clear Filters
                </button>
            </div>
        )}
    </div>
    
    {/* Orders Count */}
    <div className="mb-4">
        <p className="text-gray-400 text-sm">
            Showing {orders.length} order{orders.length !== 1 ? 's' : ''}
        </p>
    </div>
    
    <div className="space-y-8">
        {orders.map((order, orderIndex) => (
            <motion.div
            key={orderIndex}
            className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto rounded-md border border-gray-700 bg-gray-800 p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            >
            {/* Order Header */}
            <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            Order #{order.publicOrderId || order.orderId} for {order.user.name}
                        </h2>
                        <p className="text-sm text-gray-400">{order.user.email || order.user.phoneNumber}</p>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">
                                {new Date(order.createdAt).toLocaleString(undefined, {
                                dateStyle: "medium",
                                timeStyle: "short",
                                })}
                            </p>
                            <p className="text-lg font-semibold text-white">
                                Total: ₹{order.totalAmount.toFixed(2)}
                            </p>
                        </div>
                        
                        {/* Tracking Status Badge */}
                        <div className="flex justify-end">
                            {getStatusBadge(order.trackingStatus)}
                        </div>
                    </div>
                </div>
                
                {/* Shipping Address */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-1">Shipping Address:</p>
                    <p className="text-sm text-gray-400">
                        {order.address.name} • {order.address.phoneNumber}
                    </p>
                    <p className="text-sm text-gray-400">
                        {order.address.houseNumber}, {order.address.streetAddress}, {order.address.city}, {order.address.state} - {order.address.pincode}
                    </p>
                </div>
                
                {/* Admin Tracking Controls */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-2">Update Order Status:</p>
                    <div className="flex flex-wrap gap-2">
                        {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => updateTrackingStatus(order.orderId, status)}
                                disabled={updatingOrder === order.orderId || order.trackingStatus === status}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    order.trackingStatus === status
                                        ? 'bg-emerald-600 text-white cursor-not-allowed'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                } disabled:opacity-50`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Desktop / Tablet: Table */}
            <div className="hidden md:block">
                <div className="overflow-x-auto -mx-4 sm:-mx-6 lg:-mx-8">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                    <tr>
                        <th className="px-12 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Quantity
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Subtotal
                        </th>
                    </tr>
                    </thead>

                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {order.products.map((product, productIndex) => (
                        <tr key={productIndex} className="hover:bg-gray-700">
                        <td className="px-12 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-white">
                            {product.name}
                            </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            ₹{product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            ₹{(product.price * product.quantity).toFixed(2)}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Mobile: stacked cards */}
            <div className="md:hidden space-y-3 p-3">
                {order.products.map((product, productIndex) => (
                <article
                    key={productIndex}
                    className="bg-gray-900 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                >
                    <h3 className="text-sm font-medium text-white truncate">
                        {product.name}
                    </h3>
                    <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-300">
                            <span className="font-medium">Price:</span> ₹{product.price.toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium">Quantity:</span> {product.quantity}
                        </p>
                        <p className="text-sm text-gray-300">
                            <span className="font-medium">Subtotal:</span> ₹{(product.price * product.quantity).toFixed(2)}
                        </p>
                    </div>
                </article>
                ))}
            </div>
            </motion.div>
        ))}
    </div>

    </>
    
}

export default OrderslistTab;