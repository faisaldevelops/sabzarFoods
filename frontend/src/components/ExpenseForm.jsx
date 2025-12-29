import { useState } from "react";
import { useFinanceStore } from "../stores/useFinanceStore";
import toast from "react-hot-toast";

const ExpenseForm = () => {
  const [formData, setFormData] = useState({
    partner: "",
    amount: "",
    description: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const { createExpense, fetchFinanceDashboard, loading } = useFinanceStore();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.partner || !formData.amount) {
      toast.error("Please select a partner and enter an amount");
      return;
    }

    const amount = parseFloat(formData.amount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Amount must be a positive number");
      return;
    }

    try {
      await createExpense({
        partner: formData.partner,
        amount,
        description: formData.description.trim(),
        expenseDate: formData.expenseDate,
      });

      // Refresh dashboard data
      fetchFinanceDashboard();

      // Reset form but keep partner and date
      setFormData({
        partner: formData.partner,
        amount: "",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
      });
      
      toast.success("Expense added!");
    } catch (error) {
      console.error(error);
    }
  };

  const partners = ["Dawood", "Sayib", "Faisal"];

  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-lg mx-auto">
      <h3 className="text-xl font-semibold text-emerald-400 mb-4">Add Business Expense</h3>
      <p className="text-gray-400 text-sm mb-4">
        Record expenses paid by partners. These will be reimbursed proportionally from monthly sales.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Paid By</label>
          <div className="flex gap-2">
            {partners.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, partner: p }))}
                className={`flex-1 py-2 rounded font-medium transition-colors ${
                  formData.partner === p 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Amount (₹)</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            placeholder="Enter amount"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., Packaging materials, Shipping costs"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.partner || !formData.amount}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
