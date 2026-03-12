import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Plus, X, ArrowUpCircle, ArrowDownCircle, Wallet, Trash2, History } from 'lucide-react';
import toast from 'react-hot-toast';

const DailyPocket = () => {
  const [data, setData] = useState({ transactions: [], balance: 0, totalCredit: 0, totalDebit: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'credit', // Default to credit
    date: new Date().toISOString().split('T')[0]
  });

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/wallet');
      setData(data);
    } catch (err) {
      console.error('Error fetching wallet:', err.response || err);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  // 1. Normalize dates for comparison (YYYY-MM-DD)
  const formatDateForComparison = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toISOString().split('T')[0];
  };

  // 2. Filter transactions for the selected day
  const dailyTransactions = data.transactions.filter(t => 
    formatDateForComparison(t.date) === dateFilter
  );

  // 3. Calculate Opening Balance (All time before selected date)
  const openingBalance = data.transactions
    .filter(t => formatDateForComparison(t.date) < dateFilter)
    .reduce((acc, curr) => acc + (curr.type === 'credit' ? curr.amount : -curr.amount), 0);

  // 4. Calculate today's flow
  const dayCredit = dailyTransactions
    .filter(t => t.type === 'credit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const dayDebit = dailyTransactions
    .filter(t => t.type === 'debit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  // 5. Final Daily Closing Balance
  const closingBalance = openingBalance + dayCredit - dayDebit;

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/wallet', newTransaction);
      setShowModal(false);
      setNewTransaction({
        description: '',
        amount: '',
        type: 'credit',
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Transaction added successfully!');
      fetchWallet();
    } catch (err) {
      toast.error('Failed to add transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this transaction?')) {
      try {
        await api.delete(`/wallet/${id}`);
        toast.success('Removed');
        fetchWallet();
      } catch (err) {
        toast.error('Failed to remove');
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Daily Pocket</h1>
          <p className="text-gray-500 mt-1">Track your income and petty expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            <span className="text-xs font-bold text-gray-400 px-2 uppercase">View Day:</span>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
            />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary w-full sm:w-auto flex items-center gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-b-4 border-b-gray-400">
           <div className="flex items-center gap-2 text-gray-500 mb-1">
             <History className="h-3 w-3" />
             <span className="text-[10px] font-semibold uppercase tracking-wider">Opening Bal</span>
           </div>
           <span className={`text-xl font-bold ${openingBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>₹{openingBalance.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-b-4 border-b-green-500">
           <div className="flex items-center gap-2 text-green-600 mb-1">
             <ArrowUpCircle className="h-3 w-3" />
             <span className="text-[10px] font-semibold uppercase tracking-wider">Today Credit (+)</span>
           </div>
           <span className="text-xl font-bold text-gray-900">₹{dayCredit.toLocaleString()}</span>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-b-4 border-b-red-500">
           <div className="flex items-center gap-2 text-red-600 mb-1">
             <ArrowDownCircle className="h-3 w-3" />
             <span className="text-[10px] font-semibold uppercase tracking-wider">Today Debit (-)</span>
           </div>
           <span className="text-xl font-bold text-gray-900">₹{dayDebit.toLocaleString()}</span>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col border-b-4 border-b-primary-500">
           <div className="flex items-center gap-2 text-primary-600 mb-1">
             <Wallet className="h-3 w-3" />
             <span className="text-[10px] font-semibold uppercase tracking-wider">Net (Closing)</span>
           </div>
           <span className={`text-xl font-bold ${closingBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>₹{closingBalance.toLocaleString()}</span>
        </div>
      </div>

      <div className="card max-w-full border border-gray-100 shadow-sm animate-fade-in overflow-hidden">
        {loading ? (
           <div className="min-h-[400px] flex items-center justify-center">
             <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
           </div>
        ) : dailyTransactions.length === 0 ? (
           <div className="flex flex-col items-center justify-center min-h-[400px] text-gray-400">
              <Wallet className="h-16 w-16 mb-4 text-gray-200" />
              <h3 className="text-lg font-medium text-gray-900">No Entries for {new Date(dateFilter).toLocaleDateString()}</h3>
              <p>The system is carrying forward ₹{openingBalance.toLocaleString()} from previous days.</p>
           </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                  <th className="px-6 py-4 font-semibold text-gray-600">Time</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Description</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Amount (₹)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {dailyTransactions.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{t.description}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${t.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'credit' ? '+' : '-'} ₹{t.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(t._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">Log Cash Entry</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-6 space-y-4">
              <div className="flex p-1 bg-gray-100 rounded-lg">
                <button 
                  type="button"
                  onClick={() => setNewTransaction({...newTransaction, type: 'credit'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newTransaction.type === 'credit' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Credit (+)
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTransaction({...newTransaction, type: 'debit'})}
                  className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${newTransaction.type === 'debit' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
                >
                  Debit (-)
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input 
                  required
                  type="text" 
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="input-field" 
                  placeholder="E.g. Received from shop cash"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input 
                  required
                  type="number" 
                  value={newTransaction.amount}
                  onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="input-field" 
                  placeholder="E.g. 500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input 
                  type="date" 
                  value={newTransaction.date}
                  onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="input-field" 
                />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center min-w-[100px]">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPocket;
