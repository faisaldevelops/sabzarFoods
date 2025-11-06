import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react"
import axios from "../lib/axios";
import { useState } from "react";
import { useEffect } from "react";
// import { useOrderStore } from "../stores/useOrderStore";

const OrderslistTab = () => {
    // const { orders } = useOrderStore();
    // const { fetchAllOrders } = useOrderStore();
    const [ orders, setOrders ] = useState({})
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAllOrders = async () => {
            try {
                const response = await axios.get("/orders");
                setOrders(response.data.data)
            } catch (error) {
                console.error("Error fetching orders data:", error);
            } finally {
                setIsLoading(false);
            }
        };
		fetchAllOrders();
	}, []);

    console.log("Orders", orders);

    if (isLoading) {
		return <div>Loading...</div>;
	}

    const toggleFeaturedProduct = (orderIndex, productIndex) => {
        setOrders((prev) =>
        prev.map((order, i) =>
            i === orderIndex
            ? {
                ...order,
                products: order.products.map((p, j) =>
                    j === productIndex ? { ...p, isFeatured: !p.isFeatured } : p
                ),
                }
            : order
        )
        );
    };

    const deleteProduct = (orderIndex, productIndex) => {
        setOrders((prev) =>
        prev.map((order, i) =>
            i === orderIndex
            ? {
                ...order,
                products: order.products.filter((_, j) => j !== productIndex),
                }
            : order
        )
        );
    };

    return <>    
    <div className="space-y-8">
        {orders.map((order, orderIndex) => (
            <motion.div
            key={orderIndex}
            // className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto"
            className="bg-gray-800 shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto rounded-md border border-gray-700 bg-gray-800 p-3 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            >
            {/* Order Header */}
            <div className="bg-gray-900 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-700">
                <div>
                <h2 className="text-lg font-semibold text-white">
                    Order for {order.user.name}
                </h2>
                <p className="text-sm text-gray-400">{order.user.email}</p>
                </div>
                <div>
                    <div>
                        <p className="font-medium">
                            Shipping Address: {order.address.name} • {order.address.phoneNumber}
                        </p>
                        <p className="text-sm text-gray-300">
                            {order.address.houseNumber}, {order.address.streetAddress}, {order.address.city}, {order.address.state} - {order.address.pincode}
                        </p>
                    </div>

                </div>
                <div className="text-right">
                <p className="text-sm text-gray-400">
                    {new Date(order.createdAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                    })}
                </p>
                <p className="text-lg font-semibold text-white">
                    Total: ${order.totalAmount.toFixed(2)}
                </p>
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
                        Featured
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
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
                            ${product.price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                            {product.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <button
                            onClick={() =>
                                toggleFeaturedProduct(orderIndex, productIndex)
                            }
                            aria-pressed={product.isFeatured ? "true" : "false"}
                            className={`p-1 rounded-full ${
                                product.isFeatured
                                ? "bg-yellow-400 text-gray-900"
                                : "bg-gray-600 text-gray-300"
                            } hover:bg-yellow-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
                            >
                            <Star className="h-5 w-5" />
                            </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                            onClick={() => deleteProduct(orderIndex, productIndex)}
                            className="text-red-400 hover:text-red-300 focus:outline-none"
                            >
                            <Trash className="h-5 w-5" />
                            </button>
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
                    className="bg-gray-900 rounded-lg p-3 flex items-start justify-between hover:bg-gray-800 transition-colors"
                >
                    <div>
                    <h3 className="text-sm font-medium text-white truncate">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-300 mt-1">
                        <span className="font-medium">Price:</span> $
                        {product.price.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                        <span className="font-medium">Quantity: </span>
                        {product.quantity}
                    </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={() =>
                        toggleFeaturedProduct(orderIndex, productIndex)
                        }
                        aria-pressed={product.isFeatured ? "true" : "false"}
                        className={`p-2 rounded-md ${
                        product.isFeatured
                            ? "bg-yellow-400 text-gray-900"
                            : "bg-gray-700 text-gray-300"
                        } hover:bg-yellow-500 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400`}
                    >
                        <Star className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => deleteProduct(orderIndex, productIndex)}
                        className="p-2 rounded-md bg-gray-700 text-red-400 hover:text-red-300 focus:outline-none"
                    >
                        <Trash className="h-5 w-5" />
                    </button>
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