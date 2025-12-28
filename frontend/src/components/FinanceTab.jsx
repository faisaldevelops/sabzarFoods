import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Package,
  Download,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useFinanceStore } from "../stores/useFinanceStore";
import { useProductStore } from "../stores/useProductStore";
import ExpenseForm from "./ExpenseForm";
import BOMManager from "./BOMManager";
import LoadingSpinner from "./LoadingSpinner";

const FinanceTab = () => {
  const [activeSubTab, setActiveSubTab] = useState("dashboard");
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: "",
  });

  const { financeDashboard, monthlyTrend, fetchFinanceDashboard, fetchMonthlyTrend, exportFinanceCSV, loading } = useFinanceStore();
  const { products, fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
    fetchFinanceDashboard();
    fetchMonthlyTrend(6);
  }, [fetchAllProducts, fetchFinanceDashboard, fetchMonthlyTrend]);

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const filters = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    fetchFinanceDashboard(filters);
  };

  const handleExport = () => {
    const filters = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    exportFinanceCSV(filters);
  };

  const subTabs = [
    { id: "dashboard", label: "Dashboard" },
    { id: "expenses", label: "Add Expense" },
    { id: "bom", label: "Product BOM" },
  ];

  if (loading && !financeDashboard) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2 justify-center">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSubTab === tab.id
                ? "bg-emerald-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateRangeChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                />
              </div>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
              >
                Apply
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {financeDashboard && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100 text-sm">Total Revenue</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        ₹{financeDashboard.summary.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="w-12 h-12 text-emerald-200" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-red-500 to-red-700 p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm">Recovered Expenses</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        ₹{financeDashboard.summary.recoveredExpenses.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-red-200" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-orange-500 to-orange-700 p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Locked Inventory</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        ₹{financeDashboard.summary.lockedInventoryCost.toFixed(2)}
                      </p>
                    </div>
                    <Package className="w-12 h-12 text-orange-200" />
                  </div>
                </motion.div>

                <motion.div
                  className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-lg shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Net Profit</p>
                      <p className="text-3xl font-bold text-white mt-2">
                        ₹{financeDashboard.summary.netProfit.toFixed(2)}
                      </p>
                    </div>
                    <TrendingUp className="w-12 h-12 text-blue-200" />
                  </div>
                </motion.div>
              </div>

              {/* Profit Split */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">
                  Profit Split (Net Profit: ₹{financeDashboard.summary.netProfit.toFixed(2)})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-300 text-sm">Dawood (70%)</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">
                      ₹{financeDashboard.summary.profitSplit.dawood.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-300 text-sm">Sayib & Faisal (30%)</p>
                    <p className="text-2xl font-bold text-emerald-400 mt-2">
                      ₹{financeDashboard.summary.profitSplit.sayibAndFaisal.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product-wise Breakdown */}
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-emerald-400 mb-4">
                  Product-wise Cost Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="pb-3 text-gray-300">Product</th>
                        <th className="pb-3 text-gray-300">Sold</th>
                        <th className="pb-3 text-gray-300">Revenue</th>
                        <th className="pb-3 text-gray-300">Cost/Unit</th>
                        <th className="pb-3 text-gray-300">COGS</th>
                        <th className="pb-3 text-gray-300">Locked Cost</th>
                        <th className="pb-3 text-gray-300">Profit</th>
                        <th className="pb-3 text-gray-300">Margin %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financeDashboard.products.map((product, idx) => (
                        <tr key={idx} className="border-b border-gray-700">
                          <td className="py-3 text-white">
                            {product.productName}
                            {product.costing.hasIncompleteBOM && (
                              <AlertCircle className="inline ml-2 w-4 h-4 text-yellow-500" title="Incomplete BOM or missing expenses" />
                            )}
                          </td>
                          <td className="py-3 text-gray-300">{product.sales.quantitySold}</td>
                          <td className="py-3 text-gray-300">₹{product.sales.revenue.toFixed(2)}</td>
                          <td className="py-3 text-gray-300">₹{product.costing.costPerUnit.toFixed(2)}</td>
                          <td className="py-3 text-gray-300">₹{product.costing.totalCOGS.toFixed(2)}</td>
                          <td className="py-3 text-orange-400">₹{product.expenses.lockedInventoryCost.toFixed(2)}</td>
                          <td className="py-3 text-emerald-400">₹{product.profit.grossProfit.toFixed(2)}</td>
                          <td className="py-3 text-gray-300">{product.profit.grossProfitMargin.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Monthly Trend */}
              {monthlyTrend && monthlyTrend.length > 0 && (
                <div className="bg-gray-800 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-emerald-400 mb-4">
                    Monthly Profit Trend
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="pb-3 text-gray-300">Month</th>
                          <th className="pb-3 text-gray-300">Revenue</th>
                          <th className="pb-3 text-gray-300">COGS</th>
                          <th className="pb-3 text-gray-300">Profit</th>
                          <th className="pb-3 text-gray-300">Dawood (70%)</th>
                          <th className="pb-3 text-gray-300">S&F (30%)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyTrend.map((month, idx) => (
                          <tr key={idx} className="border-b border-gray-700">
                            <td className="py-3 text-white">{month.month}</td>
                            <td className="py-3 text-gray-300">₹{month.revenue.toFixed(2)}</td>
                            <td className="py-3 text-gray-300">₹{month.cogs.toFixed(2)}</td>
                            <td className="py-3 text-emerald-400">₹{month.profit.toFixed(2)}</td>
                            <td className="py-3 text-gray-300">₹{month.profitSplit.dawood.toFixed(2)}</td>
                            <td className="py-3 text-gray-300">₹{month.profitSplit.sayibAndFaisal.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Expense Form */}
      {activeSubTab === "expenses" && <ExpenseForm products={products} />}

      {/* BOM Manager */}
      {activeSubTab === "bom" && <BOMManager products={products} />}
    </div>
  );
};

export default FinanceTab;
