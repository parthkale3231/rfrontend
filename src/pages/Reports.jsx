import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Download, FileSpreadsheet, Trash2, ShoppingBag, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Reports = () => {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // New expense state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '' });
  const [submittingExpense, setSubmittingExpense] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, expRes, salesRes, farmerRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/expenses'),
        api.get('/sales'),
        api.get('/reports/purchases') // We'll need this route
      ]);
      setData(dashRes.data);
      setExpenses(expRes.data);
      setSales(salesRes.data.slice(0, 10));
      setPurchases(farmerRes.data.slice(0, 10));
    } catch (err) {
      console.error('Error fetching reports data', err);
      toast.error('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setSubmittingExpense(true);
    try {
      await api.post('/expenses', {
        description: newExpense.description,
        amount: Number(newExpense.amount)
      });
      setShowExpenseModal(false);
      setNewExpense({ description: '', amount: '' });
      toast.success('Expense successfully logged!');
      fetchData(); // Refresh all data to update dashboard summary
    } catch (err) {
      console.error('Error adding expense', err);
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
        try {
            await api.delete(`/expenses/${id}`);
            toast.success('Expense record deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete expense');
        }
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Delete this sale? This will revert stock and customer balance.')) {
        try {
            await api.delete(`/sales/${id}`);
            toast.success('Sale deleted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete sale');
        }
    }
  };

  const handleDeletePurchase = async (id) => {
    if (window.confirm('Delete this farmer purchase record?')) {
        try {
            await api.delete(`/farmers/transactions/${id}`);
            toast.success('Purchase removed');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete purchase');
        }
    }
  };

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500 h-8 w-8" /></div>;
  }

  // Very basic demo chart data bridging existing stats
  const chartData = {
    labels: ['Last Week', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'],
    datasets: [
      {
        fill: true,
        label: 'Gross Sales',
        data: [12000, 19000, 15000, 22000, 18000, 25000, data?.todaySalesTotal || 2000],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  const currentProfit = data?.todayProfit || 0;
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Financial Reports</h1>
          <p className="text-gray-500 mt-1">Daily overview of profits, sales, and total business expenses.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowExpenseModal(true)} className="btn-secondary h-10 shadow-sm border border-gray-300 rounded-md px-3 text-sm flex items-center gap-2">
            Log Expense
          </button>
          <button className="btn-primary h-10 flex items-center gap-2 shadow-md">
            <Download className="h-4 w-4" /> Export Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Profit</span>
            </div>
            <span className={`text-4xl font-bold mt-4 ${currentProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              ₹{(currentProfit).toLocaleString()}
            </span>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Today's Sales</span>
            </div>
            <span className="text-4xl font-bold text-gray-900 mt-4">
              ₹{(data?.todaySalesTotal || 0).toLocaleString()}
            </span>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl"><TrendingDown className="h-6 w-6" /></div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Ledger Expenses</span>
            </div>
            <span className="text-4xl font-bold text-red-500 mt-4">
               {expenses.length} Records
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Sales List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-blue-500" />
              Latest Sales
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
               {sales.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                    No sales recorded today.
                 </div>
               ) : sales.map(sale => (
                 <div key={sale._id} className="p-3 border border-gray-100 rounded-xl bg-blue-50/30 flex justify-between items-center group">
                   <div className="flex flex-col">
                     <span className="font-medium text-gray-900 leading-tight">{sale.customerId?.name || 'Customer'}</span>
                     <span className="text-[10px] text-gray-400">{sale.riceType} ({sale.quantity}kg)</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900 text-sm">₹{sale.totalAmount.toLocaleString()}</span>
                      <button onClick={() => handleDeleteSale(sale._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                   </div>
                 </div>
               ))}
            </div>
        </div>

        {/* Farmer Purchases List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-500" />
              Farmer Purchases
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
               {purchases.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                    No farmer paddy purchases.
                 </div>
               ) : purchases.map(p => (
                 <div key={p._id} className="p-3 border border-gray-100 rounded-xl bg-orange-50/30 flex justify-between items-center group">
                   <div className="flex flex-col">
                     <span className="font-medium text-gray-900 leading-tight">{p.farmerId?.name || 'Farmer'}</span>
                     <span className="text-[10px] text-gray-400">{p.paddyType} ({p.weight}kg)</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="font-bold text-orange-700 text-sm">₹{p.totalAmount.toLocaleString()}</span>
                      <button onClick={() => handleDeletePurchase(p._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                   </div>
                 </div>
               ))}
            </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-400" />
            Latest Expenses
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
             {expenses.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm italic">
                  No expenses recorded.
               </div>
             ) : expenses.map(expense => (
               <div key={expense._id} className="p-3 border border-gray-100 rounded-xl bg-red-50/30 flex justify-between items-center group">
                 <div className="flex flex-col">
                   <span className="font-medium text-gray-900 leading-tight">{expense.description}</span>
                   <span className="text-[10px] text-gray-400">{new Date(expense.date).toLocaleDateString()}</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="font-bold text-red-500 text-sm">₹{(expense.amount).toLocaleString()}</span>
                    <button onClick={() => handleDeleteExpense(expense._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">Log Operating Expense</h3>
               <p className="text-sm text-gray-500 mt-1">Track bills, wages, maintenance, etc.</p>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input 
                  required
                  type="text" 
                  value={newExpense.description}
                  onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                  className="input-field" 
                  placeholder="E.g. Electricity Bill, Labor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                  className="input-field" 
                  placeholder="e.g 4500"
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submittingExpense} className="btn-primary flex items-center justify-center min-w-[100px]">
                  {submittingExpense ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
