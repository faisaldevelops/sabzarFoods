import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useFinanceStore = create((set) => ({
  expenses: [],
  partnerBalances: [],
  financeDashboard: null,
  reimbursementHistory: [],
  monthlyTrend: [],
  loading: false,

  // Expense operations (simplified: partner, amount, date, description)
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

  // Partner balances
  fetchPartnerBalances: async () => {
    set({ loading: true });
    try {
      const res = await axios.get("/expenses/balances");
      set({ partnerBalances: res.data.balances, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch partner balances");
      set({ loading: false });
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

  // Process monthly reimbursement
  processReimbursement: async (year, month, recoveryPercentage) => {
    set({ loading: true });
    try {
      const res = await axios.post("/finance/reimbursement", {
        year,
        month,
        recoveryPercentage,
      });
      toast.success("Reimbursement processed successfully");
      set({ loading: false });
      return res.data.reimbursement;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process reimbursement");
      set({ loading: false });
      throw error;
    }
  },

  // Get reimbursement history
  fetchReimbursementHistory: async (limit = 12) => {
    set({ loading: true });
    try {
      const res = await axios.get(`/finance/reimbursement/history?limit=${limit}`);
      set({ reimbursementHistory: res.data.history, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch reimbursement history");
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
