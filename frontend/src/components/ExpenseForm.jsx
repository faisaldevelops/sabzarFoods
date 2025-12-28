import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Package, Calendar, User } from "lucide-react";
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

  const componentSuggestions = [
    "Jar",
    "Lid",
    "Label",
    "Raw Honey",
    "Spices",
    "Oil",
    "Packaging Box",
    "Bubble Wrap",
    "Tape",
    "Other",
  ];

  const paidBySuggestions = ["Dawood", "Sayib", "Faisal", "Company"];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.product) {
      toast.error("Please select a product");
      return;
    }

    if (!formData.component || !formData.quantityPurchased || !formData.totalCost || !formData.paidBy) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      await createExpense({
        product: formData.product,
        component: formData.component.trim(),
        quantityPurchased: parseFloat(formData.quantityPurchased),
        totalCost: parseFloat(formData.totalCost),
        paidBy: formData.paidBy.trim(),
        expenseDate: formData.expenseDate,
      });

      // Reset form
      setFormData({
        product: formData.product, // Keep product selected for convenience
        component: "",
        quantityPurchased: "",
        totalCost: "",
        paidBy: formData.paidBy, // Keep paidBy for convenience
        expenseDate: new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error creating expense:", error);
    }
  };

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-2xl font-semibold text-emerald-400 mb-6">Add New Expense</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Package className="inline w-4 h-4 mr-1" />
            Product *
          </label>
          <select
            name="product"
            value={formData.product}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">Select a product</option>
            {products.map((product) => (
              <option key={product._id} value={product._id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>

        {/* Component */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Component *
          </label>
          <input
            type="text"
            name="component"
            value={formData.component}
            onChange={handleChange}
            list="component-suggestions"
            required
            placeholder="e.g., Jar, Label, Raw Honey"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <datalist id="component-suggestions">
            {componentSuggestions.map((comp) => (
              <option key={comp} value={comp} />
            ))}
          </datalist>
        </div>

        {/* Quantity and Cost */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity Purchased *
            </label>
            <input
              type="number"
              name="quantityPurchased"
              value={formData.quantityPurchased}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="100"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <DollarSign className="inline w-4 h-4 mr-1" />
              Total Cost (₹) *
            </label>
            <input
              type="number"
              name="totalCost"
              value={formData.totalCost}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="5000"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Paid By */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <User className="inline w-4 h-4 mr-1" />
            Paid By *
          </label>
          <input
            type="text"
            name="paidBy"
            value={formData.paidBy}
            onChange={handleChange}
            list="paidby-suggestions"
            required
            placeholder="e.g., Dawood, Sayib, Faisal"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <datalist id="paidby-suggestions">
            {paidBySuggestions.map((person) => (
              <option key={person} value={person} />
            ))}
          </datalist>
        </div>

        {/* Expense Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Expense Date *
          </label>
          <input
            type="date"
            name="expenseDate"
            value={formData.expenseDate}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Cost per Unit Display */}
        {formData.quantityPurchased && formData.totalCost && (
          <div className="bg-gray-700 p-3 rounded-md">
            <p className="text-sm text-gray-300">
              Cost per unit: ₹
              {(parseFloat(formData.totalCost) / parseFloat(formData.quantityPurchased)).toFixed(2)}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Adding..." : "Add Expense"}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-md">
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> Expenses are inventory purchases, not immediate costs. 
          The system will automatically recover these costs as units sell.
        </p>
      </div>
    </motion.div>
  );
};

export default ExpenseForm;
