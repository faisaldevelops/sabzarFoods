import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Download, Calendar, RefreshCw, TrendingUp, Truck, CreditCard, Users, Wallet, PieChart } from "lucide-react";
import { useFinanceStore } from "../stores/useFinanceStore";
import ExpenseForm from "./ExpenseForm";
import LoadingSpinner from "./LoadingSpinner";

const FinanceTab = () => {
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [recoveryPercentage, setRecoveryPercentage] = useState(50);

  const { 
    financeDashboard, 
    fetchFinanceDashboard, 
    processReimbursement,
    exportFinanceCSV, 
    loading 
  } = useFinanceStore();

  useEffect(() => {
    fetchFinanceDashboard({ year: selectedMonth.year, month: selectedMonth.month });
  }, [fetchFinanceDashboard, selectedMonth]);

  const handleMonthChange = (e) => {
    const [year, month] = e.target.value.split("-");
    setSelectedMonth({ year: parseInt(year), month: parseInt(month) });
  };

  const handleProcessReimbursement = async () => {
    if (!window.confirm("Are you sure you want to process this month's reimbursement? This action cannot be undone.")) {
      return;
    }
    try {
      await processReimbursement(selectedMonth.year, selectedMonth.month, recoveryPercentage);
      fetchFinanceDashboard({ year: selectedMonth.year, month: selectedMonth.month });
    } catch (error) {
      console.error(error);
    }
  };

  const formatCurrency = (val) => `₹${(val || 0).toFixed(2)}`;

  const getMonthInputValue = () => {
    return `${selectedMonth.year}-${String(selectedMonth.month).padStart(2, '0')}`;
  };

  if (loading && !financeDashboard) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 justify-center flex-wrap">
        <button
          onClick={() => setActiveTab("summary")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "summary" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${activeTab === "add" ? "bg-emerald-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
        >
          Add Expense
        </button>
      </div>

      {activeTab === "summary" && (
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="bg-gray-800 p-4 rounded-lg flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-gray-400 mb-1">
                <Calendar className="inline w-4 h-4 mr-1" />Select Month
              </label>
              <input
                type="month"
                value={getMonthInputValue()}
                onChange={handleMonthChange}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <button 
              onClick={() => fetchFinanceDashboard({ year: selectedMonth.year, month: selectedMonth.month })} 
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button 
              onClick={() => exportFinanceCSV()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Export
            </button>
          </div>

          {/* Period Header */}
          {financeDashboard?.period && (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-emerald-400">
                {financeDashboard.period.monthName} {financeDashboard.period.year}
              </h2>
            </div>
          )}

          {/* Sales Overview Cards */}
          {financeDashboard?.sales && (
            <div className="space-y-4">
              {/* Main Sales Card */}
              <div className="bg-gray-800 p-4 rounded-lg max-w-md mx-auto">
                <p className="text-gray-400 text-xs text-center">Total Sales (Product Revenue)</p>
                <p className="text-emerald-400 text-2xl font-bold text-center">{formatCurrency(financeDashboard.sales.totalSales)}</p>
                <p className="text-gray-500 text-xs text-center mt-1">{financeDashboard.sales.orderCount} orders • Used for profit calculations</p>
              </div>
              
              {/* Fees Cards - For Display Only */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-gray-400 text-xs flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery Fees</p>
                  <p className="text-blue-400 text-lg font-bold">{formatCurrency(financeDashboard.sales.totalDeliveryCharges)}</p>
                  <p className="text-gray-600 text-xs mt-1">Recovered separately</p>
                </motion.div>
                <motion.div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <p className="text-gray-400 text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" /> Platform Fee (Constant)</p>
                  <p className="text-orange-400 text-lg font-bold">{formatCurrency(financeDashboard.sales.platformFees?.constant || 0)}</p>
                  <p className="text-gray-600 text-xs mt-1">Fixed per order</p>
                </motion.div>
                <motion.div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <p className="text-gray-400 text-xs flex items-center gap-1"><CreditCard className="w-3 h-3" /> Razorpay Fee</p>
                  <p className="text-orange-400 text-lg font-bold">{formatCurrency(financeDashboard.sales.platformFees?.razorpay || 0)}</p>
                  <p className="text-gray-600 text-xs mt-1">Variable ({financeDashboard.sales.platformFees?.razorpayPercentage || 2}%)</p>
                </motion.div>
                <motion.div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <p className="text-gray-400 text-xs">Total Platform Fees</p>
                  <p className="text-orange-400 text-lg font-bold">{formatCurrency(financeDashboard.sales.platformFees?.total || 0)}</p>
                  <p className="text-gray-600 text-xs mt-1">Recovered separately</p>
                </motion.div>
              </div>
            </div>
          )}

          {/* Partner Balances & Recovery */}
          {financeDashboard?.recovery && (
            <div className="bg-gray-800 p-5 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-400 flex items-center gap-2">
                  <Users className="w-5 h-5" /> Partner Expense Balances
                </h3>
                <div className="text-sm text-gray-400">
                  Total Pending: <span className="text-orange-400 font-bold">{formatCurrency(financeDashboard.recovery.totalPendingBalance)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {financeDashboard.recovery.partnerRecovery.map((partner, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-gray-700 p-4 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <p className="text-white font-bold text-lg mb-3">{partner.partner}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Paid:</span>
                        <span className="text-purple-400 font-medium">{formatCurrency(partner.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Reimbursed:</span>
                        <span className="text-emerald-400 font-medium">{formatCurrency(partner.totalReimbursed)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-gray-600">
                        <span className="text-gray-300">Pending Balance:</span>
                        <span className={`font-bold ${partner.pendingBalance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                          {formatCurrency(partner.pendingBalance)}
                        </span>
                      </div>
                      {partner.pendingBalance > 0 && (
                        <div className="flex justify-between text-xs pt-1">
                          <span className="text-gray-500">Est. Reimbursement:</span>
                          <span className="text-emerald-300">{formatCurrency(partner.potentialReimbursement)}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Recovery Pool Calculator */}
              <div className="bg-gray-700/50 p-4 rounded-lg">
                <h4 className="text-md font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" /> Monthly Recovery Pool
                </h4>
                <div className="flex flex-wrap gap-4 items-end">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Recovery %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={recoveryPercentage}
                      onChange={(e) => setRecoveryPercentage(Number(e.target.value))}
                      className="w-24 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-400">Pool Amount: </span>
                    <span className="text-emerald-400 font-bold text-lg">
                      {formatCurrency(financeDashboard.sales.totalSales * (recoveryPercentage / 100))}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  {recoveryPercentage}% of {formatCurrency(financeDashboard.sales.totalSales)} = Recovery pool distributed proportionally to pending balances
                </p>
              </div>
            </div>
          )}

          {/* Profit Section */}
          {financeDashboard?.profit && (
            <div className="bg-gray-800 p-5 rounded-lg">
              <h3 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Profit Calculation (Preview)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profit Summary */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total Sales:</span>
                    <span className="text-emerald-400">{formatCurrency(financeDashboard.profit.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Est. Reimbursement:</span>
                    <span className="text-orange-400">- {formatCurrency(financeDashboard.profit.totalReimbursement)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-600">
                    <span className="text-white font-medium">Est. Profit:</span>
                    <span className={`font-bold text-lg ${financeDashboard.profit.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(financeDashboard.profit.profit)}
                    </span>
                  </div>
                </div>

                {/* Profit Split */}
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                    <PieChart className="w-4 h-4" /> Profit Split
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Dawood ({financeDashboard.profit.profitSplitPercentage.dawood}%):</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(financeDashboard.profit.profitSplit.dawood)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Sayib + Faisal ({financeDashboard.profit.profitSplitPercentage.sayibAndFaisal}%):</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(financeDashboard.profit.profitSplit.sayibAndFaisal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Process Reimbursement Button */}
              <div className="mt-4 pt-4 border-t border-gray-700">
                {financeDashboard.existingReimbursement?.isFinalized ? (
                  <div className="bg-emerald-900/30 text-emerald-400 p-3 rounded text-sm">
                    ✓ Reimbursement already processed for this month on{" "}
                    {new Date(financeDashboard.existingReimbursement.createdAt).toLocaleDateString()}
                  </div>
                ) : (
                  <button
                    onClick={handleProcessReimbursement}
                    disabled={loading || financeDashboard.recovery.totalPendingBalance === 0}
                    className="w-full py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Processing..." : "Process Monthly Reimbursement"}
                  </button>
                )}
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
                      <th className="text-left py-2">Partner</th>
                      <th className="text-right py-2">Amount</th>
                      <th className="text-left py-2">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeDashboard.recentExpenses.map((exp, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{new Date(exp.date).toLocaleDateString()}</td>
                        <td className="py-2 text-white font-medium">{exp.partner}</td>
                        <td className="py-2 text-right text-purple-400">{formatCurrency(exp.amount)}</td>
                        <td className="py-2 text-gray-300">{exp.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!financeDashboard?.recentExpenses || financeDashboard.recentExpenses.length === 0) && 
           financeDashboard?.recovery?.totalPendingBalance === 0 && (
            <div className="bg-gray-800 p-8 rounded-lg text-center">
              <p className="text-gray-400 mb-4">No expenses recorded for this month</p>
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

      {activeTab === "add" && <ExpenseForm />}
    </div>
  );
};

export default FinanceTab;
