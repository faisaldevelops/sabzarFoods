import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Calendar, RefreshCw } from "lucide-react";
import { useFinanceStore } from "../stores/useFinanceStore";
import { useProductStore } from "../stores/useProductStore";
import ExpenseForm from "./ExpenseForm";
import LoadingSpinner from "./LoadingSpinner";

const FinanceTab = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [dateRange, setDateRange] = useState({ startDate: "", endDate: "" });

  const { financeDashboard, fetchFinanceDashboard, exportFinanceCSV, loading } = useFinanceStore();
  const { products, fetchAllProducts } = useProductStore();

  useEffect(() => {
    fetchAllProducts();
    fetchFinanceDashboard();
  }, [fetchAllProducts, fetchFinanceDashboard]);

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const applyFilter = () => {
    const filters = {};
    if (dateRange.startDate) filters.startDate = dateRange.startDate;
    if (dateRange.endDate) filters.endDate = dateRange.endDate;
    fetchFinanceDashboard(filters);
  };

  const formatCurrency = (val) => `₹${(val || 0).toFixed(2)}`;

  if (loading && !financeDashboard) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === "summary" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          Summary
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-md font-medium ${activeTab === "add" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300"}`}
        >
          Add Expense
        </button>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Date Filter */}
          <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />From
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />To
              </label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <button onClick={applyFilter} className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
              Apply
            </button>
            <button onClick={() => fetchFinanceDashboard()} className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => exportFinanceCSV(dateRange)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Settlement Summary - Who should get money back */}
          {financeDashboard?.settlement && financeDashboard.settlement.length > 0 && (
            <div className="bg-gray-800 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Settlement Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {financeDashboard.settlement.map((item, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-gray-700 p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <p className="text-white font-bold text-lg mb-3">{item.payer}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Paid:</span>
                        <span className="text-purple-400 font-medium">{formatCurrency(item.totalPaid)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Recovered:</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(item.totalRecovered)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-600">
                        <span className="text-gray-300">Pending:</span>
                        <span className={`font-bold ${item.pendingRecovery > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {formatCurrency(item.pendingRecovery)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Product-wise breakdown */}
          {financeDashboard?.productSummaries && financeDashboard.productSummaries.length > 0 && (
            <div className="bg-gray-800 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">By Product</h3>
              <div className="space-y-4">
                {financeDashboard.productSummaries.map((prod, idx) => (
                  <div key={idx} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-white font-medium">{prod.productName}</span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-600 text-gray-300">
                        {prod.recoveryRate.toFixed(0)}% recovered
                      </span>
                    </div>
                    <div className="flex gap-6 text-sm mb-3">
                      <div>
                        <span className="text-gray-400">Expenses: </span>
                        <span className="text-purple-400">{formatCurrency(prod.totalExpense)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Sales: </span>
                        <span className="text-emerald-400">{formatCurrency(prod.totalSales)}</span>
                      </div>
                    </div>
                    {prod.payerRecovery.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {prod.payerRecovery.map((pr, i) => (
                          <div key={i} className="text-xs bg-gray-600 px-2 py-1 rounded">
                            <span className="text-gray-300">{pr.payer}: </span>
                            <span className="text-emerald-400">{formatCurrency(pr.recovered)}</span>
                            <span className="text-gray-500"> / {formatCurrency(pr.paid)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Expenses */}
          {financeDashboard?.recentExpenses && financeDashboard.recentExpenses.length > 0 && (
            <div className="bg-gray-800 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4">Recent Expenses</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="text-left py-2">Date</th>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Component</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-left py-2">Paid By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeDashboard.recentExpenses.map((exp, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-2 text-white">{exp.product}</td>
                        <td className="py-2 text-gray-300">{exp.component}</td>
                        <td className="py-2 text-right text-purple-400">{formatCurrency(exp.amount)}</td>
                        <td className="py-2 text-gray-300">{exp.paidBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!financeDashboard?.settlement || financeDashboard.settlement.length === 0) && 
           (!financeDashboard?.recentExpenses || financeDashboard.recentExpenses.length === 0) && (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <p className="text-gray-400 mb-4">No expenses recorded yet</p>
              <button
                onClick={() => setActiveTab("add")}
                className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Add First Expense
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "add" && <ExpenseForm products={products} />}
    </div>
  );
};

export default FinanceTab;
