import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useFinanceStore = create((set) => ({
  expenses: [],
  bomEntries: [],
  financeDashboard: null,
  monthlyTrend: [],
  loading: false,

  // Expense operations
  createExpense: async (expenseData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/expenses", expenseData);
      set((prevState) => ({
        expenses: [res.data.expense, ...prevState.expenses],
        loading: false,
      }));
      toast.success("Expense added successfully");
      return res.data.expense;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add expense");
      set({ loading: false });
      throw error;
    }
  },

  fetchExpenses: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await axios.get(`/expenses?${params}`);
      set({ expenses: res.data.expenses, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch expenses");
      set({ loading: false });
    }
  },

  updateExpense: async (id, expenseData) => {
    set({ loading: true });
    try {
      const res = await axios.put(`/expenses/${id}`, expenseData);
      set((prevState) => ({
        expenses: prevState.expenses.map((exp) =>
          exp._id === id ? res.data.expense : exp
        ),
        loading: false,
      }));
      toast.success("Expense updated successfully");
      return res.data.expense;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update expense");
      set({ loading: false });
      throw error;
    }
  },

  deleteExpense: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/expenses/${id}`);
      set((prevState) => ({
        expenses: prevState.expenses.filter((exp) => exp._id !== id),
        loading: false,
      }));
      toast.success("Expense deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete expense");
      set({ loading: false });
      throw error;
    }
  },

  // BOM operations
  upsertBOM: async (bomData) => {
    set({ loading: true });
    try {
      const res = await axios.post("/bom", bomData);
      set((prevState) => {
        const existingIndex = prevState.bomEntries.findIndex(
          (b) => b.product === bomData.product && b.component === bomData.component
        );
        let updatedEntries;
        if (existingIndex !== -1) {
          updatedEntries = [...prevState.bomEntries];
          updatedEntries[existingIndex] = res.data.bom;
        } else {
          updatedEntries = [res.data.bom, ...prevState.bomEntries];
        }
        return { bomEntries: updatedEntries, loading: false };
      });
      toast.success(res.data.message);
      return res.data.bom;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save BOM");
      set({ loading: false });
      throw error;
    }
  },

  fetchAllBOM: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/bom");
      set({ bomEntries: res.data.bomEntries, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch BOM");
      set({ loading: false });
    }
  },

  fetchBOMByProduct: async (productId) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/bom/product/${productId}`);
      set({ bomEntries: res.data.bomEntries, loading: false });
      return res.data.bomEntries;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch BOM");
      set({ loading: false });
      throw error;
    }
  },

  deleteBOM: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`/bom/${id}`);
      set((prevState) => ({
        bomEntries: prevState.bomEntries.filter((b) => b._id !== id),
        loading: false,
      }));
      toast.success("BOM entry deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete BOM entry");
      set({ loading: false });
      throw error;
    }
  },

  // Finance dashboard operations
  fetchFinanceDashboard: async (filters = {}) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams(filters);
      const res = await axios.get(`/finance/dashboard?${params}`);
      set({ financeDashboard: res.data, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch finance data");
      set({ loading: false });
    }
  },

  fetchMonthlyTrend: async (months = 6) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/finance/trends/monthly?months=${months}`);
      set({ monthlyTrend: res.data.monthlyTrend, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch monthly trend");
      set({ loading: false });
    }
  },

  exportFinanceCSV: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters);
      const res = await axios.get(`/finance/export/csv?${params}`, {
        responseType: "blob",
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `finance-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Cleanup to prevent memory leaks
      window.URL.revokeObjectURL(url);
      
      toast.success("Finance report exported successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to export report");
      throw error;
    }
  },
}));
