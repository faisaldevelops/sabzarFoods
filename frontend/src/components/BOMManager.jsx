import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, Save } from "lucide-react";
import { useFinanceStore } from "../stores/useFinanceStore";
import toast from "react-hot-toast";

const BOMManager = ({ products }) => {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [bomEntries, setBomEntries] = useState([]);
  const [newEntry, setNewEntry] = useState({
    component: "",
    quantityPerUnit: "",
    description: "",
  });

  const { fetchBOMByProduct, upsertBOM, deleteBOM, loading } = useFinanceStore();

  useEffect(() => {
    if (selectedProduct) {
      loadBOMForProduct(selectedProduct);
    } else {
      setBomEntries([]);
    }
  }, [selectedProduct]);

  const loadBOMForProduct = async (productId) => {
    try {
      const entries = await fetchBOMByProduct(productId);
      setBomEntries(entries || []);
    } catch (error) {
      console.error("Error loading BOM:", error);
      setBomEntries([]);
    }
  };

  const handleProductChange = (e) => {
    setSelectedProduct(e.target.value);
    setNewEntry({ component: "", quantityPerUnit: "", description: "" });
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntry((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();

    if (!selectedProduct) {
      toast.error("Please select a product first");
      return;
    }

    if (!newEntry.component || !newEntry.quantityPerUnit) {
      toast.error("Please fill in component and quantity");
      return;
    }

    try {
      await upsertBOM({
        product: selectedProduct,
        component: newEntry.component.trim(),
        quantityPerUnit: parseFloat(newEntry.quantityPerUnit),
        description: newEntry.description.trim(),
      });

      // Reload BOM
      await loadBOMForProduct(selectedProduct);

      // Reset new entry form
      setNewEntry({ component: "", quantityPerUnit: "", description: "" });
    } catch (error) {
      console.error("Error adding BOM entry:", error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm("Are you sure you want to delete this BOM entry?")) {
      return;
    }

    try {
      await deleteBOM(entryId);
      setBomEntries((prev) => prev.filter((entry) => entry._id !== entryId));
    } catch (error) {
      console.error("Error deleting BOM entry:", error);
    }
  };

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
  ];

  return (
    <motion.div
      className="bg-gray-800 p-6 rounded-lg max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-2xl font-semibold text-emerald-400 mb-6">
        Product Bill of Materials (BOM)
      </h3>

      {/* Product Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          <Package className="inline w-4 h-4 mr-1" />
          Select Product
        </label>
        <select
          value={selectedProduct}
          onChange={handleProductChange}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Choose a product to configure BOM</option>
          {products.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <>
          {/* Add New BOM Entry Form */}
          <div className="bg-gray-700 p-4 rounded-lg mb-6">
            <h4 className="text-lg font-semibold text-emerald-400 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Add Component
            </h4>
            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Component Name *
                  </label>
                  <input
                    type="text"
                    name="component"
                    value={newEntry.component}
                    onChange={handleNewEntryChange}
                    list="bom-component-suggestions"
                    required
                    placeholder="e.g., Jar"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <datalist id="bom-component-suggestions">
                    {componentSuggestions.map((comp) => (
                      <option key={comp} value={comp} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Quantity per Unit *
                  </label>
                  <input
                    type="number"
                    name="quantityPerUnit"
                    value={newEntry.quantityPerUnit}
                    onChange={handleNewEntryChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="1"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={newEntry.description}
                    onChange={handleNewEntryChange}
                    placeholder="e.g., 250ml glass jar"
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 text-white font-semibold rounded-md hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Saving..." : "Save Component"}
              </button>
            </form>
          </div>

          {/* Existing BOM Entries */}
          <div>
            <h4 className="text-lg font-semibold text-emerald-400 mb-4">
              Current BOM Configuration
            </h4>
            {bomEntries.length === 0 ? (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-md p-4 text-center">
                <p className="text-yellow-200">
                  No BOM entries configured for this product yet. Add components above to define the recipe.
                </p>
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                        Component
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                        Qty per Unit
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">
                        Description
                      </th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-200">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bomEntries.map((entry) => (
                      <tr key={entry._id} className="border-t border-gray-600">
                        <td className="px-4 py-3 text-white">{entry.component}</td>
                        <td className="px-4 py-3 text-gray-300">{entry.quantityPerUnit}</td>
                        <td className="px-4 py-3 text-gray-300">
                          {entry.description || "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntry(entry._id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-md">
        <p className="text-sm text-blue-200">
          <strong>How BOM works:</strong> Define the recipe for each product by specifying
          which components are needed and in what quantity per unit. The system will use this
          to calculate the cost per unit based on your expense entries.
        </p>
      </div>
    </motion.div>
  );
};

export default BOMManager;
