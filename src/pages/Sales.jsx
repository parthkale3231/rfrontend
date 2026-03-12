import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stock, setStock] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newSale, setNewSale] = useState({ 
    customerId: '', 
    riceType: '', 
    quantity: '', 
    rate: '', 
    paymentStatus: 'Paid' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('All'); // 'All', 'Paid', 'Unpaid'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, stockRes] = await Promise.all([
        api.get('/sales'),
        api.get('/customers'),
        api.get('/stock')
      ]);
      setSales(salesRes.data);
      setCustomers(custRes.data);
      setStock(stockRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
      toast.error('Failed to load sales and inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSale = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/sales', newSale);
      setShowModal(false);
      setNewSale({ customerId: '', riceType: '', quantity: '', rate: '', paymentStatus: 'Paid' });
      toast.success('Sale successfully recorded!');
      fetchData(); // Refresh list to update stock and sales table
    } catch (err) {
      console.error('Error adding sale', err);
      toast.error(err.response?.data?.message || 'Failed to record sale. Ensure you have sufficient stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSale = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale? This will also return the quantity to stock and adjust customer balance.')) {
        try {
            await api.delete(`/sales/${id}`);
            toast.success('Sale deleted and stock reverted');
            fetchData();
        } catch (err) {
            toast.error('Failed to delete sale');
        }
    }
  };

  const filteredSales = sales.filter(sale => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Paid') return sale.paymentStatus === 'Paid';
    if (activeTab === 'Unpaid') return sale.paymentStatus === 'Pending' || sale.paymentStatus === 'Partial';
    return true;
  });

  const totals = {
    paid: sales.filter(s => s.paymentStatus === 'Paid').reduce((acc, s) => acc + (s.totalAmount || 0), 0),
    unpaid: sales.filter(s => s.paymentStatus !== 'Paid').reduce((acc, s) => acc + (s.totalAmount || 0), 0),
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Sales Records</h1>
          <p className="text-gray-500 mt-1">Manage rice sales and view transactions.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
          <Plus className="h-4 w-4" /> Record Sale
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Collected</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totals.paid.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Outstanding</span>
          <p className="text-2xl font-bold text-gray-900 mt-1">₹{totals.unpaid.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-gray-100 w-fit rounded-lg">
        {['All', 'Paid', 'Unpaid'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab} {tab !== 'All' ? `(${sales.filter(s => tab === 'Paid' ? s.paymentStatus === 'Paid' : (s.paymentStatus === 'Pending' || s.paymentStatus === 'Partial')).length})` : ''}
          </button>
        ))}
      </div>

      <div className="card max-w-full border border-gray-100 shadow-sm animate-fade-in">
        {loading ? (
           <div className="min-h-[400px] flex items-center justify-center">
             <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
           </div>
        ) : filteredSales.length === 0 ? (
           <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-gray-400 p-6">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No {activeTab.toLowerCase()} sales found</h3>
              <p className="text-sm">Get started by recording a new sale.</p>
           </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                  <th className="px-6 py-4 font-semibold text-gray-600">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Customer</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Rice Type</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Quantity (kg)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Rate/kg</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Total</th>
                  <th className="px-6 py-4 font-semibold text-gray-600">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-gray-500">{new Date(sale.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{sale.customerId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.riceType}</td>
                    <td className="px-6 py-4 text-gray-600">{sale.quantity} kg</td>
                    <td className="px-6 py-4 text-gray-600 text-right">₹{sale.rate}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 text-right">₹{(sale.totalAmount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                        ${sale.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 
                          sale.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                         {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDeleteSale(sale._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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

      {/* Record Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">Record New Sale</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleRecordSale} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
                  <select 
                    required
                    value={newSale.customerId}
                    onChange={e => setNewSale({...newSale, customerId: e.target.value})}
                    className="input-field"
                  >
                    <option value="" disabled>Select Customer</option>
                    {customers.map(c => (
                      <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rice Type *</label>
                  <select 
                    required
                    value={newSale.riceType}
                    onChange={e => setNewSale({...newSale, riceType: e.target.value})}
                    className="input-field"
                  >
                    <option value="" disabled>Select Rice in Stock</option>
                    {stock.map(s => (
                      <option key={s._id} value={s.riceType}>{s.riceType} (Avail: {s.remainingStock}kg)</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newSale.quantity}
                    onChange={e => setNewSale({...newSale, quantity: e.target.value})}
                    className="input-field" 
                    placeholder="e.g 100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate per kg (₹) *</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newSale.rate}
                    onChange={e => setNewSale({...newSale, rate: e.target.value})}
                    className="input-field" 
                    placeholder="e.g 45"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status *</label>
                  <select 
                    required
                    value={newSale.paymentStatus}
                    onChange={e => setNewSale({...newSale, paymentStatus: e.target.value})}
                    className="input-field"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6 -mx-6 px-6 pb-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors mt-4">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center min-w-[100px] mt-4">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
