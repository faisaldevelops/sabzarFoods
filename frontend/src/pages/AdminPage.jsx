// import { BarChart, PlusCircle, ShoppingBag, ShoppingBasket } from "lucide-react";
// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";

// import AnalyticsTab from "../components/AnalyticsTab";
// import CreateProductForm from "../components/CreateProductForm";
// import ProductsList from "../components/ProductsList";
// import { useProductStore } from "../stores/useProductStore";
// import OrderslistTab from "../components/OrdersTab";

// const tabs = [
// 	{ id: "create", label: "Create Product", icon: PlusCircle },
// 	{ id: "products", label: "Products", icon: ShoppingBasket },
// 	{ id: "analytics", label: "Analytics", icon: BarChart },
// 	{ id: "orders", label: "Orders", icon: ShoppingBag },
// ];

// const AdminPage = () => {
// 	const [activeTab, setActiveTab] = useState("create");
// 	const { fetchAllProducts } = useProductStore();
	
// 	useEffect(() => {
// 		fetchAllProducts();
// 	}, [fetchAllProducts]);
	

// 	return (
// 		<div className='min-h-screen relative overflow-hidden'>
// 			<div className='relative z-10 container mx-auto px-4 py-16'>
// 				<motion.h1
// 					className='text-4xl font-bold mb-8 text-emerald-400 text-center'
// 					initial={{ opacity: 0, y: -20 }}
// 					animate={{ opacity: 1, y: 0 }}
// 					transition={{ duration: 0.8 }}
// 				>
// 					Admin Dashboard
// 				</motion.h1>

// 				<div className='flex justify-center mb-8'>
// 					{tabs.map((tab) => (
// 						<button
// 							key={tab.id}
// 							onClick={() => setActiveTab(tab.id)}
// 							className={`flex items-center px-4 py-2 mx-2 rounded-md transition-colors duration-200 ${
// 								activeTab === tab.id
// 									? "bg-emerald-600 text-white"
// 									: "bg-gray-700 text-gray-300 hover:bg-gray-600"
// 							}`}
// 						>
// 							<tab.icon className='mr-2 h-5 w-5' />
// 							{tab.label}
// 						</button>
// 					))}
// 				</div>
// 				{activeTab === "create" && <CreateProductForm />}
// 				{activeTab === "products" && <ProductsList />}
// 				{activeTab === "analytics" && <AnalyticsTab />}
// 				{activeTab === "orders" && <OrderslistTab />}
// 			</div>
// 		</div>
// 	);
// };
// export default AdminPage;


import { BarChart, PlusCircle, ShoppingBag, ShoppingBasket, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import { useProductStore } from "../stores/useProductStore";
import OrderslistTab from "../components/OrdersTab";
import FinanceTab from "../components/FinanceTab";

const tabs = [
  { id: "create", label: "Create Product", icon: PlusCircle },
  { id: "products", label: "Products", icon: ShoppingBasket },
  { id: "analytics", label: "Analytics", icon: BarChart },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "finance", label: "Finance / Costing", icon: DollarSign },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("create");
  const { fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-900 text-white">
      <div className="relative z-10 container mx-auto px-4 py-16">
        <motion.h1
          className="text-4xl font-bold mb-8 text-emerald-400 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Admin Dashboard
        </motion.h1>

        {/* ✅ Responsive Grid Tabs (2 per row on small, 3-5 per row on large) */}
        <div
          className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5
            gap-3 mb-8
            max-w-5xl mx-auto
          "
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center justify-center px-4 py-3 rounded-md text-sm font-medium
                transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }
              `}
            >
              <tab.icon className="mr-2 h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ✅ Tab Content */}
        <div className="mt-4">
          {activeTab === "create" && <CreateProductForm />}
          {activeTab === "products" && <ProductsList />}
          {activeTab === "analytics" && <AnalyticsTab />}
          {activeTab === "orders" && <OrderslistTab />}
          {activeTab === "finance" && <FinanceTab />}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
