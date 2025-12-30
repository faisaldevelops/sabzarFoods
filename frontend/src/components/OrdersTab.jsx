import { motion } from "framer-motion";
import { Truck, Package, CheckCircle, XCircle, Search, Filter, Download, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
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
    
    // Confirmation modal state
    const [confirmationModal, setConfirmationModal] = useState({
        isOpen: false,
        orderId: null,
        currentStatus: null,
        newStatus: null,
        orderPublicId: null
    });
    
    // Shipping details state (for when changing to shipped)
    const [shippingDetails, setShippingDetails] = useState({
        trackingNumber: '',
        deliveryPartner: ''
    });
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(10); // Items per page
    const [pagination, setPagination] = useState({
        totalOrders: 0,
        totalPages: 0,
        currentPage: 1,
        hasNextPage: false,
        hasPrevPage: false
    });
    
    // Debounced filters for API calls
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    // Debounce filter changes to avoid excessive API calls
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedFilters(filters);
            setCurrentPage(1); // Reset to first page when filters change
        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [filters]);

    // Extract fetchAllOrders function so it can be reused
    const fetchAllOrders = useCallback(async (pageToFetch = null) => {
        try {
            setIsLoading(true);
            // Build query parameters
            const params = new URLSearchParams();
            if (debouncedFilters.phoneNumber) params.append('phoneNumber', debouncedFilters.phoneNumber);
            if (debouncedFilters.orderId) params.append('publicOrderId', debouncedFilters.orderId);
            if (debouncedFilters.status && debouncedFilters.status !== 'all') params.append('status', debouncedFilters.status);
            // Add pagination parameters - use provided page or current page
            const page = pageToFetch !== null ? pageToFetch : currentPage;
            params.append('page', page.toString());
            params.append('limit', pageSize.toString());
            const queryString = params.toString();
            const url = `/orders?${queryString}`;
            const response = await axios.get(url);
            const ordersData = response.data.data || [];
            
            // Update pagination metadata
            if (response.data.pagination) {
                const paginationData = response.data.pagination;
                setPagination(paginationData);
                
                // If current page is empty and not page 1, adjust to last available page
                if (ordersData.length === 0 && page > 1 && paginationData.totalPages > 0) {
                    const lastPage = paginationData.totalPages;
                    // Fetch the last page instead
                    params.set('page', lastPage.toString());
                    const newQueryString = params.toString();
                    const newUrl = `/orders?${newQueryString}`;
                    const newResponse = await axios.get(newUrl);
                    const newOrdersData = newResponse.data.data || [];
                    setOrders(newOrdersData);
                    setCurrentPage(lastPage);
                    if (newResponse.data.pagination) {
                        setPagination(newResponse.data.pagination);
                    }
                    return;
                } else if (pageToFetch !== null && pageToFetch !== currentPage) {
                    // Update current page if we fetched a different page
                    setCurrentPage(page);
                }
            }
            
            setOrders(ordersData);
        } catch (error) {
            console.error("Error fetching orders data:", error);
            toast.error(error.response?.data?.message || "Failed to fetch orders");
        } finally {
            setIsLoading(false);
        }
    }, [debouncedFilters, currentPage, pageSize]);

    useEffect(() => {
		fetchAllOrders();
	}, [fetchAllOrders]);
// Removed duplicate/broken useEffect and setDisplayOrderIds calls

    const updateTrackingStatus = async (orderId, newStatus, trackingNumber = null, deliveryPartner = null) => {
        setUpdatingOrder(orderId);
        try {
            const payload = {
                trackingStatus: newStatus,
                note: `Status updated to ${newStatus}`,
            };
            
            // Include tracking details if provided (for shipped status)
            if (trackingNumber) {
                payload.trackingNumber = trackingNumber;
            }
            if (deliveryPartner) {
                payload.deliveryPartner = deliveryPartner;
            }
            
            const response = await axios.patch(`/orders/${orderId}/tracking`, payload);
            
            if (response.data.success) {
                // Refetch orders to respect current filters
                // This ensures orders that no longer match the filter are removed
                await fetchAllOrders();
                toast.success(`Order status updated to ${getStatusDisplayName(newStatus)}`);
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
            pending: { color: "bg-yellow-500", icon: Package, text: "Payment pending" },
            processing: { color: "bg-blue-500", icon: Package, text: "Processing" },
            ready: { color: "bg-cyan-500", icon: Package, text: "Ready" },
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

    const getStatusDisplayName = (status) => {
        const statusNames = {
            pending: "Payment pending",
            processing: "Processing",
            ready: "Ready",
            shipped: "Shipped",
            delivered: "Delivered",
            cancelled: "Cancelled"
        };
        return statusNames[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const handleStatusChangeClick = (orderId, newStatus, orderPublicId, currentStatus) => {
        // Reset shipping details when opening modal
        setShippingDetails({ trackingNumber: '', deliveryPartner: '' });
        setConfirmationModal({
            isOpen: true,
            orderId,
            currentStatus,
            newStatus,
            orderPublicId
        });
    };

    const handleConfirmStatusChange = async () => {
        if (!confirmationModal.orderId || !confirmationModal.newStatus) return;
        
        // Pass tracking details if changing to shipped
        const trackingNumber = confirmationModal.newStatus === 'shipped' ? shippingDetails.trackingNumber : null;
        const deliveryPartner = confirmationModal.newStatus === 'shipped' ? shippingDetails.deliveryPartner : null;
        
        await updateTrackingStatus(
            confirmationModal.orderId, 
            confirmationModal.newStatus,
            trackingNumber || null,
            deliveryPartner || null
        );
        
        // Reset shipping details
        setShippingDetails({ trackingNumber: '', deliveryPartner: '' });
        setConfirmationModal({
            isOpen: false,
            orderId: null,
            currentStatus: null,
            newStatus: null,
            orderPublicId: null
        });
    };

    const handleCancelStatusChange = () => {
        setShippingDetails({ trackingNumber: '', deliveryPartner: '' });
        setConfirmationModal({
            isOpen: false,
            orderId: null,
            currentStatus: null,
            newStatus: null,
            orderPublicId: null
        });
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

    const handleExportCSV = async () => {
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (debouncedFilters.phoneNumber) params.append('phoneNumber', debouncedFilters.phoneNumber);
            if (debouncedFilters.orderId) params.append('publicOrderId', debouncedFilters.orderId);
            if (debouncedFilters.status && debouncedFilters.status !== 'all') params.append('status', debouncedFilters.status);
            const queryString = params.toString();
            const url = queryString ? `/orders/export/csv?${queryString}` : '/orders/export/csv';
            
            // Make the request with responseType blob
            const response = await axios.get(url, {
                responseType: 'blob'
            });
            
            // Create a download link and trigger download
            const blob = new Blob([response.data], { type: 'text/csv' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `orders-${Date.now()}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            
            toast.success('Orders exported successfully');
        } catch (error) {
            console.error('Error exporting orders:', error);
            toast.error(error.response?.data?.message || 'Failed to export orders');
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setCurrentPage(newPage);
            // Scroll to top when page changes
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const renderPaginationControls = () => {
        if (pagination.totalPages <= 1) return null;

        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="flex items-center justify-center gap-2 mt-6">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pagination.hasPrevPage
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>

                {startPage > 1 && (
                    <>
                        <button
                            onClick={() => handlePageChange(1)}
                            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                        >
                            1
                        </button>
                        {startPage > 2 && (
                            <span className="px-2 text-gray-400">...</span>
                        )}
                    </>
                )}

                {pages.map((page) => (
                    <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            page === currentPage
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                        }`}
                    >
                        {page}
                    </button>
                ))}

                {endPage < pagination.totalPages && (
                    <>
                        {endPage < pagination.totalPages - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                            onClick={() => handlePageChange(pagination.totalPages)}
                            className="px-3 py-2 rounded-md text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors"
                        >
                            {pagination.totalPages}
                        </button>
                    </>
                )}

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        pagination.hasNextPage
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        );
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
                        <option value="pending">Payment pending</option>
                        <option value="processing">Processing</option>
                        <option value="ready">Ready</option>
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
    
    {/* Orders Count and Export Button */}
    <div className="mb-4 flex items-center justify-between">
        <div>
            <p className="text-gray-400 text-sm">
                Showing {orders.length} of {pagination.totalOrders} order{pagination.totalOrders !== 1 ? 's' : ''}
            </p>
            {pagination.totalPages > 1 && (
                <p className="text-gray-500 text-xs mt-1">
                    Page {pagination.currentPage} of {pagination.totalPages}
                </p>
            )}
        </div>
        <motion.button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            <Download className="w-4 h-4" />
            Export CSV
        </motion.button>
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
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-semibold text-white">
                                Order #{order.publicOrderId || order.orderId} for {order.user.name}
                            </h2>
                            {order.isManualOrder && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    Manual
                                </span>
                            )}
                            {order.orderSource && order.orderSource !== "website" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 capitalize">
                                    {order.orderSource === "whatsapp" ? "💬 WhatsApp" : 
                                     order.orderSource === "instagram" ? "📸 Instagram" : 
                                     order.orderSource === "phone" ? "📞 Phone" : order.orderSource}
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-400">{order.user.email || order.user.phoneNumber}</p>
                        {order.isManualOrder && (
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                                <span>Payment: <span className="text-gray-300 capitalize">{order.paymentMethod?.replace('_', ' ')}</span></span>
                                <span className={`px-1.5 py-0.5 rounded ${
                                    order.paymentStatus === 'paid' ? 'bg-green-500/20 text-green-400' :
                                    order.paymentStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {order.paymentStatus?.toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <div className="text-right">
                            <p className="text-sm text-gray-400">
                                {new Date(order.createdAt).toLocaleString('en-IN', {
                                timeZone: 'Asia/Kolkata',
                                dateStyle: "medium",
                                timeStyle: "short",
                                })}
                            </p>
                            <p className="text-lg font-semibold text-white">
                                Total: ₹{order.totalAmount.toFixed(2)}
                            </p>
                            {(order.deliveryFee > 0 || order.platformFee > 0) && (
                                <p className="text-xs text-gray-500">
                                    {order.deliveryFee > 0 && `Delivery: ₹${order.deliveryFee}`}
                                    {order.deliveryFee > 0 && order.platformFee > 0 && ' • '}
                                    {order.platformFee > 0 && `Platform: ₹${order.platformFee}`}
                                </p>
                            )}
                        </div>
                        
                        {/* Tracking Status Badge */}
                        <div className="flex justify-end">
                            {getStatusBadge(order.trackingStatus)}
                        </div>
                    </div>
                </div>
                
                {/* Shipping Address */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <div>
                        <p className="text-sm font-medium text-gray-300 mb-1">Shipping Address:</p>
                        <p className="text-sm text-gray-400">
                            {order.address.name} • {order.address.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-400">
                            {order.address.houseNumber}, {order.address.streetAddress}, {order.address.city}, {order.address.state} - {order.address.pincode}
                        </p>
                    </div>
                </div>
                
                {/* Admin Notes (for manual orders) */}
                {order.adminNotes && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                        <p className="text-sm font-medium text-gray-300 mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-400 bg-gray-800 rounded p-2 italic">{order.adminNotes}</p>
                    </div>
                )}

                {/* Admin Tracking Controls */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm font-medium text-gray-300 mb-2">Update Order Status:</p>
                    <div className="flex flex-wrap gap-2">
                        {['pending', 'processing', 'ready', 'shipped', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusChangeClick(order.orderId, status, order.publicOrderId || order.orderId, order.trackingStatus)}
                                disabled={updatingOrder === order.orderId || order.trackingStatus === status}
                                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    order.trackingStatus === status
                                        ? 'bg-emerald-600 text-white cursor-not-allowed'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                } disabled:opacity-50`}
                            >
                                {getStatusDisplayName(status)}
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

    {/* Pagination Controls */}
    {renderPaginationControls()}

    {/* Confirmation Modal */}
    {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-700"
            >
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Confirm Status Change
                        </h3>
                        <p className="text-gray-300 text-sm mb-4">
                            Are you sure you want to change the status of Order #{confirmationModal.orderPublicId} from{' '}
                            <span className="font-semibold text-white">
                                {getStatusDisplayName(confirmationModal.currentStatus)}
                            </span>{' '}
                            to{' '}
                            <span className="font-semibold text-white">
                                {getStatusDisplayName(confirmationModal.newStatus)}
                            </span>?
                        </p>
                        
                        {/* Shipping Details Fields - Only show when changing to shipped */}
                        {confirmationModal.newStatus === 'shipped' && (
                            <div className="mb-4 p-3 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                                    Shipping Details (Optional)
                                </p>
                                
                                {/* Delivery Partner Dropdown */}
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">
                                        Delivery Partner
                                    </label>
                                    <select
                                        value={shippingDetails.deliveryPartner}
                                        onChange={(e) => setShippingDetails(prev => ({ ...prev, deliveryPartner: e.target.value }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">Select delivery partner</option>
                                        <option value="india_post">India Post (Speed Post)</option>
                                        <option value="delhivery">Delhivery</option>
                                    </select>
                                </div>
                                
                                {/* Tracking Number Input */}
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">
                                        Tracking Number
                                    </label>
                                    <input
                                        type="text"
                                        value={shippingDetails.trackingNumber}
                                        onChange={(e) => setShippingDetails(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                        placeholder="Enter tracking number"
                                        className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelStatusChange}
                                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmStatusChange}
                                disabled={updatingOrder === confirmationModal.orderId}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updatingOrder === confirmationModal.orderId ? 'Updating...' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )}

    </>
    
}

export default OrderslistTab;