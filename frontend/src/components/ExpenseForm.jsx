import { useState } from "react";
import { useFinanceStore } from "../stores/useFinanceStore";
import toast from "react-hot-toast";

const ExpenseForm = ({ products }) => {
  const [formData, setFormData] = useState({
    product: "",
    component: "",
    quantityPurchased: "",
    totalCost: "",
    paidBy: "",
    expenseDate: new Date().toISOString().split("T")[0],
  });

  const { createExpense, loading } = useFinanceStore();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product || !formData.component || !formData.quantityPurchased || !formData.totalCost || !formData.paidBy) {
      toast.error("Please fill all fields");
      return;
    }

    const qty = parseFloat(formData.quantityPurchased);
    const cost = parseFloat(formData.totalCost);

    if (qty <= 0 || cost <= 0) {
      toast.error("Quantity and cost must be positive");
      return;
    }

    try {
      await createExpense({
        product: formData.product,
        component: formData.component.trim(),
        quantityPurchased: qty,
        totalCost: cost,
        paidBy: formData.paidBy,
        expenseDate: formData.expenseDate,
      });

      setFormData({
        product: formData.product,
        component: "",
        quantityPurchased: "",
        totalCost: "",
        paidBy: formData.paidBy,
        expenseDate: new Date().toISOString().split("T")[0],
      });
      
      toast.success("Expense added!");
    } catch (error) {
      console.error(error);
    }
  };

  const payers = ["Dawood", "Sayib", "Faisal"];

  return (
    <div className="bg-gray-800 p-6 rounded-lg max-w-lg mx-auto">
      <h3 className="text-xl font-semibold text-emerald-400 mb-4">Add Expense</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Product</label>
          <select
            name="product"
            value={formData.product}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          >
            <option value="">Select product</option>
            {products.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Component</label>
          <input
            type="text"
            name="component"
            value={formData.component}
            onChange={handleChange}
            placeholder="e.g., Jar, Lid, Honey"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Quantity</label>
            <input
              type="number"
              name="quantityPurchased"
              value={formData.quantityPurchased}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="100"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Cost (₹)</label>
            <input
              type="number"
              name="totalCost"
              value={formData.totalCost}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              placeholder="5000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Paid By</label>
          <div className="flex gap-2">
            {payers.map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, paidBy: p }))}
                className={`flex-1 py-2 rounded font-medium ${formData.paidBy === p ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Date</label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
          />
        </div>

        {formData.quantityPurchased && formData.totalCost && parseFloat(formData.quantityPurchased) > 0 && (
          <div className="text-sm text-gray-400">
            Cost per unit: ₹{(parseFloat(formData.totalCost) / parseFloat(formData.quantityPurchased)).toFixed(2)}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 disabled:bg-gray-600"
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;
