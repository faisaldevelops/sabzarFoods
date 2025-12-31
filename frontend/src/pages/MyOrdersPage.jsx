import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, XCircle, Clock, MapPin, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner";

const MyOrdersPage = () => {
	const [orders, setOrders] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	
	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize] = useState(4); // 4 orders per page
	const [pagination, setPagination] = useState({
		totalOrders: 0,
		totalPages: 0,
		currentPage: 1,
		hasNextPage: false,
		hasPrevPage: false
	});

	const fetchOrders = useCallback(async (pageToFetch = null) => {
		try {
			setIsLoading(true);
			const page = pageToFetch !== null ? pageToFetch : currentPage;
			const response = await axios.get(`/orders/my-orders?page=${page}&limit=${pageSize}`);
			setOrders(response.data.data || []);
			
			// Update pagination metadata
			if (response.data.pagination) {
				setPagination(response.data.pagination);
				if (pageToFetch !== null && pageToFetch !== currentPage) {
					setCurrentPage(page);
				}
			}
		} catch (error) {
			console.error("Error fetching orders:", error);
			toast.error(error.response?.data?.message || "Failed to fetch orders");
		} finally {
			setIsLoading(false);
		}
	}, [currentPage, pageSize]);

	useEffect(() => {
		fetchOrders();
	}, [fetchOrders]);

	const getStatusConfig = (status) => {
		const configs = {
			pending: { color: "bg-yellow-500", icon: Clock, text: "Pending", textColor: "text-yellow-400" },
			processing: { color: "bg-blue-500", icon: Package, text: "Processing", textColor: "text-blue-400" },
			ready: { color: "bg-cyan-500", icon: Package, text: "Ready", textColor: "text-cyan-400" },
			shipped: { color: "bg-purple-500", icon: Truck, text: "Shipped", textColor: "text-purple-400" },
			delivered: { color: "bg-green-500", icon: CheckCircle, text: "Delivered", textColor: "text-green-400" },
			cancelled: { color: "bg-red-500", icon: XCircle, text: "Cancelled", textColor: "text-red-400" },
		};
		return configs[status] || configs.pending;
	};

	const StatusBadge = ({ status }) => {
		const config = getStatusConfig(status);
		const Icon = config.icon;
		
		return (
			<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white ${config.color}`}>
				<Icon className="w-3 h-3 mr-1" />
				{config.text}
			</span>
		);
	};

	const TrackingTimeline = ({ history }) => {
		const [isExpanded, setIsExpanded] = useState(false);
		
		if (!history || history.length === 0) return null;

		// Get the most recent status (last item in array)
		const currentStatus = history[history.length - 1];
		const config = getStatusConfig(currentStatus.status);
		const Icon = config.icon;

		return (
			<div className="mt-3 pt-3 border-t border-gray-700/50">
				<button
					onClick={() => setIsExpanded(!isExpanded)}
					className="w-full flex items-center justify-between text-left"
				>
					<div className="flex items-center gap-2">
						<div className={`w-5 h-5 rounded-full ${config.color} flex items-center justify-center`}>
							<Icon className="w-2.5 h-2.5 text-white" />
						</div>
						<span className={`text-xs font-medium ${config.textColor}`}>{config.text}</span>
						<span className="text-xs text-gray-500">
							{new Date(currentStatus.timestamp).toLocaleDateString('en-IN', {
								timeZone: 'Asia/Kolkata',
								day: 'numeric',
								month: 'short',
							})}
						</span>
					</div>
					<ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
				</button>

				{/* Full History - Collapsible */}
				{isExpanded && (
					<div className="mt-3 relative border-l-2 border-gray-700 pl-5 ml-2.5 space-y-3">
						{[...history].reverse().map((item, index) => {
							const itemConfig = getStatusConfig(item.status);
							const ItemIcon = itemConfig.icon;
							
							return (
								<div key={index} className="relative">
									<div className={`absolute -left-[1.4rem] w-4 h-4 rounded-full ${itemConfig.color} flex items-center justify-center`}>
										<ItemIcon className="w-2 h-2 text-white" />
									</div>
									<div className="text-xs text-gray-400">
										{new Date(item.timestamp).toLocaleString('en-IN', {
											timeZone: 'Asia/Kolkata',
											dateStyle: "medium",
											timeStyle: "short",
										})}
									</div>
									<div className={`text-xs font-medium ${itemConfig.textColor}`}>
										{itemConfig.text}
									</div>
									{item.note && (
										<div className="text-xs text-gray-500">{item.note}</div>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>
		);
	};

	// Collapsible Order Card Component
	const OrderCard = ({ order, index }) => {
		const [isExpanded, setIsExpanded] = useState(false);
		const totalItems = order.products.reduce((sum, item) => sum + item.quantity, 0);
		
		return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3, delay: index * 0.03 }}
			className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden shadow-lg hover:border-emerald-500/30 transition-all duration-300"
		>
				{/* Compact Header - Always Visible */}
				<div 
					className="px-4 py-3 cursor-pointer"
					onClick={() => setIsExpanded(!isExpanded)}
				>
					<div className="flex items-center gap-3">
						{/* Product thumbnails */}
						<div className="flex -space-x-2 flex-shrink-0">
							{order.products.slice(0, 3).map((item, idx) => (
								<div key={idx} className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gray-800 bg-gray-700">
									{item.image ? (
										<img src={item.image} alt={item.name} className="w-full h-full object-cover" />
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Package className="w-4 h-4 text-gray-500" />
										</div>
									)}
								</div>
							))}
							{order.products.length > 3 && (
								<div className="w-10 h-10 rounded-lg border-2 border-gray-800 bg-gray-700 flex items-center justify-center">
									<span className="text-xs text-gray-400">+{order.products.length - 3}</span>
								</div>
							)}
						</div>

						{/* Order info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-sm font-medium text-white">#{order.publicOrderId || order.orderId}</span>
								<StatusBadge status={order.trackingStatus} />
							</div>
							<div className="text-xs text-gray-400 mt-0.5">
								{totalItems} item{totalItems !== 1 ? 's' : ''} • {new Date(order.createdAt).toLocaleDateString('en-IN', {
									timeZone: 'Asia/Kolkata',
									day: 'numeric',
									month: 'short',
									year: 'numeric'
								})}
							</div>
						</div>

						{/* Amount & expand */}
						<div className="flex items-center gap-3 flex-shrink-0">
							<span className="text-lg font-bold text-emerald-400">₹{order.totalAmount.toFixed(0)}</span>
							<ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
						</div>
					</div>
				</div>

				{/* Expanded Details */}
				{isExpanded && (
					<div className="px-4 pb-4 border-t border-gray-700/50">
						{/* Tracking Info */}
						{(order.trackingNumber || order.deliveryPartner || order.estimatedDelivery) && (
							<div className="py-3 space-y-1.5 border-b border-gray-700/50">
								{order.deliveryPartner && (
									<div className="flex items-center text-xs">
										<Truck className="w-3.5 h-3.5 mr-2 text-purple-400" />
										<span className="text-gray-400">Via</span>
										<span className="ml-1 text-purple-400 font-medium">
											{order.deliveryPartner === 'india_post' ? 'India Post' : 
											 order.deliveryPartner === 'delhivery' ? 'Delhivery' : 
											 order.deliveryPartner}
										</span>
									</div>
								)}
								{order.trackingNumber && (
									<div className="flex items-center text-xs">
										<Package className="w-3.5 h-3.5 mr-2 text-emerald-400" />
										<span className="text-gray-400">Tracking:</span>
										<span className="ml-1 font-mono text-emerald-400">{order.trackingNumber}</span>
									</div>
								)}
								{order.estimatedDelivery && (
									<div className="flex items-center text-xs">
										<Clock className="w-3.5 h-3.5 mr-2 text-blue-400" />
										<span className="text-gray-400">Expected:</span>
										<span className="ml-1 text-blue-400">
											{new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
												timeZone: 'Asia/Kolkata',
												dateStyle: "medium",
											})}
										</span>
									</div>
								)}
							</div>
						)}

						{/* Order Items */}
						<div className="py-3 space-y-2">
							{order.products.map((item, idx) => (
								<div key={idx} className="flex items-center gap-3 bg-gray-900/30 rounded-lg p-2">
									<div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-700">
										{item.image ? (
											<img src={item.image} alt={item.name} className="w-full h-full object-cover" />
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<Package className="w-5 h-5 text-gray-500" />
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<h5 className="text-xs font-medium text-white truncate">{item.name}</h5>
										<div className="text-xs text-gray-400">
											{item.quantity} × ₹{item.price} = <span className="text-emerald-400">₹{(item.price * item.quantity).toFixed(0)}</span>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* Shipping Address - Compact */}
						{order.address && (
							<div className="pt-3 border-t border-gray-700/50">
								<div className="flex items-start gap-2">
									<MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
									<div className="text-xs text-gray-400">
										<span className="text-gray-300">{order.address.name}</span> • {order.address.phoneNumber}
										<br />
										{order.address.houseNumber}, {order.address.streetAddress}, {order.address.city} - {order.address.pincode}
									</div>
								</div>
							</div>
						)}

						{/* Tracking History */}
						{order.trackingHistory && order.trackingHistory.length > 0 && (
							<TrackingTimeline history={order.trackingHistory} />
						)}
					</div>
				)}
			</motion.div>
		);
	};

	if (isLoading) {
		return <LoadingSpinner />;
	}

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
			<div className="flex items-center justify-center gap-2 mt-8">
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

	if (orders.length === 0 && !isLoading) {
		return (
			<div className="min-h-screen bg-stone-900 flex items-center justify-center overscroll-none">
				<div className="text-center">
					<Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
					<h2 className="text-2xl font-semibold text-gray-300 mb-2">No Orders Yet</h2>
					<p className="text-gray-400">Start shopping to see your orders here!</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-stone-900 py-8 px-4 sm:px-6 lg:px-8 overscroll-none">
			<div className="max-w-5xl mx-auto">
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.3 }}
				>
					<div className="flex items-center justify-between mb-2">
						<h1 className="text-4xl font-bold text-emerald-400">My Orders</h1>
						{pagination.totalOrders > 0 && (
							<div className="text-right">
								<p className="text-gray-400 text-sm">
									Showing {orders.length} of {pagination.totalOrders} order{pagination.totalOrders !== 1 ? 's' : ''}
								</p>
								{pagination.totalPages > 1 && (
									<p className="text-gray-500 text-xs mt-1">
										Page {pagination.currentPage} of {pagination.totalPages}
									</p>
								)}
							</div>
						)}
					</div>
					<p className="text-gray-400 mb-8">Track and manage your orders</p>
				</motion.div>

				<div className="space-y-3">
					{orders.map((order, index) => (
						<OrderCard key={order.orderId} order={order} index={index} />
					))}
				</div>

				{/* Pagination Controls */}
				{renderPaginationControls()}
			</div>
		</div>
	);
};

export default MyOrdersPage;
