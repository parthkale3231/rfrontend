import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Search, Plus, X, ShoppingBag, Edit2, Trash2, IndianRupee, History } from 'lucide-react';
import toast from 'react-hot-toast';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [newCustomer, setNewCustomer] = useState({ 
    name: '', 
    mobile: '',
    riceType: '',
    quantity: '',
    rate: '',
    paidAmount: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const calculatedTotal = (Number(newCustomer.quantity) || 0) * (Number(newCustomer.rate) || 0);

  useEffect(() => {
    fetchCustomers();
    fetchStocks();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/customers?search=${search}`);
      setCustomers(data);
    } catch (err) {
      console.error('Error fetching customers', err);
      toast.error('Failed to load customers data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStocks = async () => {
    try {
      const { data } = await api.get('/stock');
      setStocks(data);
    } catch (err) {
      console.error('Error fetching stocks', err);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer._id}`, newCustomer);
        toast.success('Customer updated successfully!');
      } else {
        await api.post('/customers', newCustomer);
        toast.success('Customer and Sale recorded successfully!');
      }
      setShowAddModal(false);
      resetForm();
      fetchCustomers();
    } catch (err) {
      console.error('Error saving customer', err);
      toast.error(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amountToPay = Number(paymentAmount);
    
    // Robust calculation from primitives for validation
    const weight = Number(selectedCustomer.lastQuantity) || 0;
    const rate = Number(selectedCustomer.lastRate) || 0;
    const total = weight * rate;
    const paid = Number(selectedCustomer.paidAmount) || 0;
    const balance = total - paid;

    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast.error('Enter a valid amount');
        return;
    }

    if (amountToPay > balance + 0.01) {
        if (!window.confirm(`Payment ₹${amountToPay} exceeds balance ₹${balance}. Proceed?`)) return;
    }

    setSubmitting(true);
    try {
        await api.post(`/customers/${selectedCustomer._id}/payments`, {
            amount: amountToPay,
            note: paymentNote
        });
        toast.success('Payment recorded');
        setShowPayModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        fetchCustomers();
    } catch (err) {
        toast.error('Failed to add payment');
    } finally {
        setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Deleted');
        fetchCustomers();
      } catch (err) {
        toast.error('Failed to delete');
      }
    }
  };

  const handleEditClick = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name,
      mobile: customer.mobile,
      riceType: customer.lastRiceType || '',
      quantity: customer.lastQuantity || '',
      rate: customer.lastRate || '',
      paidAmount: customer.paidAmount || 0
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setEditingCustomer(null);
    setNewCustomer({ name: '', mobile: '', riceType: '', quantity: '', rate: '', paidAmount: '' });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Directory</h1>
          <p className="text-gray-500 mt-1">Manage buyers and installments.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search customers..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 input-field w-full sm:w-64 text-sm bg-white" 
             />
          </div>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="btn-primary flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      <div className="card max-w-full border border-gray-100 shadow-sm animate-fade-in overflow-hidden">
        {loading ? (
           <div className="min-h-[400px] flex items-center justify-center">
             <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
           </div>
        ) : customers.length === 0 ? (
           <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-gray-400 p-6">
              <ShoppingBag className="w-16 h-16 text-gray-200 mb-2" />
              <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
              <p className="text-sm">Start by adding your first buyer.</p>
           </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider font-bold text-gray-500">
                  <th className="px-6 py-4">Customer Details</th>
                  <th className="px-6 py-4">Rice Type</th>
                  <th className="px-6 py-4 text-right">Qty (kg)</th>
                  <th className="px-6 py-4 text-right">Total Bill</th>
                  <th className="px-6 py-4 text-right">Paid</th>
                  <th className="px-6 py-4 text-right">Remaining</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {customers.map((customer) => {
                  // Live calculation for robustness
                  const weight = Number(customer.lastQuantity) || 0;
                  const rate = Number(customer.lastRate) || 0;
                  const actualTotal = weight * rate;
                  const actualPaid = Number(customer.paidAmount) || 0;
                  const actualRemaining = actualTotal - actualPaid;

                  return (
                    <tr key={customer._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{customer.name}</div>
                        <div className="text-xs text-gray-500">{customer.mobile}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${customer.lastRiceType ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                          {customer.lastRiceType || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-right font-medium">{weight}</td>
                      <td className="px-6 py-4 font-bold text-gray-900 text-right">₹{actualTotal.toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-green-600 text-right">₹{actualPaid.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${actualRemaining <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          ₹{actualRemaining.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1">
                          <button 
                            onClick={() => { setSelectedCustomer(customer); setShowPayModal(true); setPaymentAmount(''); }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Receive Payment"
                          >
                            <IndianRupee className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => { setSelectedCustomer(customer); setShowHistoryModal(true); }}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="History"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleEditClick(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteCustomer(customer._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">{editingCustomer ? 'Edit Customer' : 'New Customer & Sale'}</h3>
               <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required type="text" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} className="input-field" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <input required type="text" value={newCustomer.mobile} onChange={e => setNewCustomer({...newCustomer, mobile: e.target.value})} className="input-field" />
                </div>
                
                <div className="col-span-2 pt-2 border-t border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="h-3 w-3" /> Sale Details
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rice Type</label>
                  <select value={newCustomer.riceType} onChange={e => setNewCustomer({...newCustomer, riceType: e.target.value})} className="input-field">
                    <option value="">-- Choose Stock --</option>
                    {stocks.map(s => <option key={s._id} value={s.riceType}>{s.riceType} ({s.remainingStock} kg left)</option>)}
                  </select>
                </div>

                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg)</label>
                  <input type="number" value={newCustomer.quantity} onChange={e => setNewCustomer({...newCustomer, quantity: e.target.value})} className="input-field" placeholder="0" />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate (₹/kg)</label>
                  <input type="number" value={newCustomer.rate} onChange={e => setNewCustomer({...newCustomer, rate: e.target.value})} className="input-field" placeholder="0" />
                </div>

                {!editingCustomer && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Paid Amount (₹)</label>
                    <input type="number" value={newCustomer.paidAmount} onChange={e => setNewCustomer({...newCustomer, paidAmount: e.target.value})} className="input-field" placeholder="How much did they pay now?" />
                  </div>
                )}

                {newCustomer.quantity && newCustomer.rate && (
                  <div className="col-span-2 bg-primary-50 p-4 rounded-xl flex justify-between items-center border border-primary-100 mt-2">
                    <span className="text-sm font-medium text-primary-700">Total Bill:</span>
                    <span className="text-xl font-extrabold text-primary-900">₹{calculatedTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center min-w-[120px]">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingCustomer ? 'Update' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Remaining Modal */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
               <div>
                  <h3 className="text-lg font-bold text-gray-900">Receive Payment</h3>
                  <p className="text-xs text-green-700">From {selectedCustomer.name}</p>
               </div>
               <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
             </div>
             
             {(() => {
                const weight = Number(selectedCustomer.lastQuantity) || 0;
                const rate = Number(selectedCustomer.lastRate) || 0;
                const total = weight * rate;
                const paid = Number(selectedCustomer.paidAmount) || 0;
                const balance = total - paid;

                return (
                  <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                       <span className="text-sm text-gray-500">Pending Balance:</span>
                       <span className="text-lg font-bold text-red-600">₹{balance.toLocaleString()}</span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Receive (₹) *</label>
                      <input 
                        required 
                        type="number" 
                        step="0.01"
                        min="1"
                        value={paymentAmount} 
                        onChange={e => setPaymentAmount(e.target.value)} 
                        className="input-field text-lg font-bold text-green-600"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                      <input 
                        type="text" 
                        value={paymentNote} 
                        onChange={e => setPaymentNote(e.target.value)} 
                        className="input-field"
                        placeholder="E.g. Cash payment, GPay"
                      />
                    </div>

                    <button type="submit" disabled={submitting} className="w-full btn-primary h-12 text-base shadow-lg shadow-primary-200">
                      {submitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `Confirm Receipt`}
                    </button>
                  </form>
                );
             })()}
           </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedCustomer && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                 <div>
                    <h3 className="text-lg font-bold text-gray-900">Payment Trace</h3>
                    <p className="text-xs text-gray-500">History for {selectedCustomer.name}</p>
                 </div>
                 <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5"/></button>
              </div>

              <div className="p-6 max-h-[350px] overflow-y-auto">
                 {(!selectedCustomer.paymentHistory || selectedCustomer.paymentHistory.length === 0) ? (
                    <div className="text-center py-10 text-gray-400">No payment history found.</div>
                 ) : (
                    <div className="relative border-l-2 border-primary-100 ml-3 space-y-6">
                       {selectedCustomer.paymentHistory.map((h, i) => (
                          <div key={i} className="relative pl-6">
                             <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary-500" />
                             <div className="flex justify-between items-start">
                                <div>
                                   <div className="text-sm font-bold text-gray-900">₹{h.amount.toLocaleString()}</div>
                                   <div className="text-[10px] text-gray-500">
                                      {new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                   </div>
                                   {h.note && <div className="text-xs text-primary-600 italic">"{h.note}"</div>}
                                </div>
                                <div className="text-green-600 bg-green-50 p-1.5 rounded-lg">
                                   <IndianRupee className="h-4 w-4" />
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Summary Footer exactly like Farmers */}
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                  {(() => {
                      const weight = Number(selectedCustomer.lastQuantity) || 0;
                      const rate = Number(selectedCustomer.lastRate) || 0;
                      const totalBill = weight * rate;
                      const totalPaid = Number(selectedCustomer.paidAmount) || 0;
                      const rem = totalBill - totalPaid;
                      return (
                          <>
                              <div className="text-[11px]">
                                  <p className="text-gray-500 font-medium">Total Bill: ₹{totalBill.toLocaleString()}</p>
                                  <p className="text-green-600 font-bold uppercase tracking-tighter">Total Paid: ₹{totalPaid.toLocaleString()}</p>
                              </div>
                              <div className={`px-4 py-2 rounded-xl text-xs font-black shadow-sm ${rem <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  DUE: ₹{rem.toLocaleString()}
                              </div>
                          </>
                      );
                  })()}
              </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default Customers;
