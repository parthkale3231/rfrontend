import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Search, Plus, X, Edit2, Trash2, IndianRupee, History, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [newFarmer, setNewFarmer] = useState({ 
    name: '', 
    mobile: '', 
    village: '',
    paddyWeight: '',
    ratePerQuintal: '',
    paidAmount: ''
  });
  const [submitting, setSubmitting] = useState(false);
  
  // Payment Trace state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Auto-calculate total and remaining
  const calculatedTotal = (Number(newFarmer.paddyWeight) || 0) * (Number(newFarmer.ratePerQuintal) || 0);
  const calculatedRemaining = calculatedTotal - (Number(newFarmer.paidAmount) || 0);

  useEffect(() => {
    fetchFarmers();
  }, [search]);

  const fetchFarmers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/farmers?search=${search}`);
      // Force correct remainingAmount calculation to fix any database discrepancies
      const sanitizedData = data.map(f => ({
        ...f,
        remainingAmount: (f.totalCost || 0) - (f.paidAmount || 0)
      }));
      setFarmers(sanitizedData);
    } catch (err) {
      console.error('Error fetching farmers', err);
      toast.error('Failed to load farmers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFarmer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingFarmer) {
        await api.put(`/farmers/${editingFarmer._id}`, newFarmer);
        toast.success('Farmer updated successfully!');
      } else {
        await api.post('/farmers', newFarmer);
        toast.success('Farmer added successfully!');
      }
      setShowModal(false);
      resetForm();
      fetchFarmers();
    } catch (err) {
      console.error('Error saving farmer', err);
      toast.error(err.response?.data?.message || 'Failed to save farmer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (window.confirm('Are you sure you want to delete this farmer?')) {
      try {
        await api.delete(`/farmers/${id}`);
        toast.success('Farmer deleted successfully!');
        fetchFarmers();
      } catch (err) {
        toast.error('Failed to delete farmer');
      }
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    
    const amountToPay = Number(paymentAmount);
    // Force recalculation from primitives for absolute accuracy
    const weight = Number(selectedFarmer.paddyWeight) || 0;
    const rate = Number(selectedFarmer.ratePerQuintal) || 0;
    const total = weight * rate;
    const paid = Number(selectedFarmer.paidAmount) || 0;
    const balance = total - paid;

    if (isNaN(amountToPay) || amountToPay <= 0) {
        toast.error('Please enter a valid positive amount');
        return;
    }

    if (amountToPay > balance + 0.01) { // Small buffer for decimals
        if (!window.confirm(`Payment amount (₹${amountToPay}) exceeds the remaining balance (₹${balance}). Do you want to proceed?`)) {
            return;
        }
    }

    setSubmitting(true);
    try {
        await api.post(`/farmers/${selectedFarmer._id}/payments`, {
            amount: amountToPay,
            note: paymentNote
        });
        toast.success('Payment recorded successfully');
        setShowPayModal(false);
        setPaymentAmount('');
        setPaymentNote('');
        fetchFarmers();
    } catch (err) {
        console.error('Payment error:', err);
        toast.error(err.response?.data?.message || 'Failed to add payment. Ensure amount is positive.');
    } finally {
        setSubmitting(false);
    }
  };

  const handleEditClick = (farmer) => {
    setEditingFarmer(farmer);
    setNewFarmer({
      name: farmer.name,
      mobile: farmer.mobile,
      village: farmer.village || '',
      paddyWeight: farmer.paddyWeight || '',
      ratePerQuintal: farmer.ratePerQuintal || '',
      paidAmount: farmer.paidAmount || 0
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingFarmer(null);
    setNewFarmer({ name: '', mobile: '', village: '', paddyWeight: '', ratePerQuintal: '', paidAmount: '' });
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Farmer Directory</h1>
          <p className="text-gray-500 mt-1">Manage farmers and log their paddy deposits.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
             <input 
               type="text" 
               placeholder="Search farmers..." 
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="pl-9 input-field w-full sm:w-64 text-sm bg-white" 
             />
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4" /> Add Farmer
          </button>
        </div>
      </div>

      <div className="card max-w-full border border-gray-100 shadow-sm animate-fade-in">
        {loading ? (
           <div className="min-h-[400px] flex items-center justify-center">
             <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
           </div>
        ) : farmers.length === 0 ? (
           <div className="flex flex-col items-center justify-center min-h-[400px] gap-2 text-gray-400 p-6">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900">No farmers found</h3>
              <p className="text-sm">Get started by adding a new farmer.</p>
           </div>
        ) : (
          <div className="table-container">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm">
                  <th className="px-6 py-4 font-semibold text-gray-600">Farmer Details</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Weight (Q)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Rate (₹/Q)</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Total Bill</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Paid</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right text-red-600">Remaining</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {farmers.map((farmer) => (
                  <tr key={farmer._id} className="hover:bg-gray-50/50 transition-colors">
                    {(() => {
                      // Robust local calculation to prevent any database sync issues
                      const weight = Number(farmer.paddyWeight) || 0;
                      const rate = Number(farmer.ratePerQuintal) || 0;
                      const actualTotal = weight * rate;
                      const actualPaid = Number(farmer.paidAmount) || 0;
                      const actualRemaining = actualTotal - actualPaid;

                      return (
                        <>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{farmer.name}</div>
                            <div className="text-xs text-gray-500">{farmer.mobile} • {farmer.village || 'No Village'}</div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-right">{weight}</td>
                          <td className="px-6 py-4 text-gray-600 text-right">{rate}</td>
                          <td className="px-6 py-4 font-semibold text-gray-900 text-right">₹{actualTotal.toLocaleString()}</td>
                          <td className="px-6 py-4 text-green-600 font-medium text-right">₹{actualPaid.toLocaleString()}</td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${actualRemaining > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                              ₹{actualRemaining.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right flex justify-end gap-1">
                            <button 
                              onClick={() => { 
                                setSelectedFarmer({...farmer, totalCost: actualTotal, remainingAmount: actualRemaining}); 
                                setShowPayModal(true); 
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Give Payment"
                            >
                              <IndianRupee className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => { setSelectedFarmer(farmer); setShowHistoryModal(true); }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Payment History"
                            >
                              <History className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleEditClick(farmer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteFarmer(farmer._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </>
                      );
                    })()}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Farmer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">{editingFarmer ? 'Edit Farmer Purchase' : 'Add New Farmer Purchase'}</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleAddFarmer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    required
                    type="text" 
                    value={newFarmer.name}
                    onChange={e => setNewFarmer({...newFarmer, name: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. Ganesh Patil"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                  <input 
                    required
                    type="text" 
                    value={newFarmer.mobile}
                    onChange={e => setNewFarmer({...newFarmer, mobile: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. 9876543210"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paddy Weight (Quintal)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newFarmer.paddyWeight}
                    onChange={e => setNewFarmer({...newFarmer, paddyWeight: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. 10.5"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rate per Quintal (₹)</label>
                  <input 
                    required
                    type="number" 
                    value={newFarmer.ratePerQuintal}
                    onChange={e => setNewFarmer({...newFarmer, ratePerQuintal: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. 2100"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1 bg-green-50 p-2 rounded-lg">
                  <label className="block text-sm font-bold text-green-700 mb-1">At Moment Paid (₹)</label>
                  <input 
                    type="number" 
                    value={newFarmer.paidAmount}
                    onChange={e => setNewFarmer({...newFarmer, paidAmount: e.target.value})}
                    className="input-field border-green-200 focus:ring-green-500" 
                    placeholder="E.g. 5000"
                    disabled={editingFarmer}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Village (Optional)</label>
                  <input 
                    type="text" 
                    value={newFarmer.village}
                    onChange={e => setNewFarmer({...newFarmer, village: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. Baramati"
                  />
                </div>
              </div>

              <div className="bg-primary-50 p-4 rounded-xl space-y-2 border border-primary-100 italic">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-primary-700">Total Cost:</span>
                    <span className="text-lg font-bold text-primary-900">₹{calculatedTotal.toLocaleString()}</span>
                </div>
                {!editingFarmer && (
                <div className="flex justify-between items-center border-t border-primary-100 pt-2">
                    <span className="text-sm font-medium text-red-700">Remaining to Give:</span>
                    <span className="text-lg font-bold text-red-900">₹{calculatedRemaining.toLocaleString()}</span>
                </div>
                )}
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center min-w-[100px]">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingFarmer ? 'Update' : 'Save Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showHistoryModal && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <div>
                  <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                  <p className="text-xs text-gray-500">Trace of money given to {selectedFarmer.name}</p>
               </div>
               <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
                {selectedFarmer.paymentHistory && selectedFarmer.paymentHistory.length > 0 ? (
                    <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                        {selectedFarmer.paymentHistory.map((pay, i) => (
                            <div key={i} className="relative pl-6">
                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary-500" />
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-bold text-gray-900">₹{pay.amount.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">{new Date(pay.date).toLocaleDateString()} at {new Date(pay.date).toLocaleTimeString()}</p>
                                    </div>
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">{pay.note || 'Payment'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-400">No payment history found.</div>
                )}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                {(() => {
                    const totalCost = (Number(selectedFarmer.paddyWeight) || 0) * (Number(selectedFarmer.ratePerQuintal) || 0);
                    const totalPaid = Number(selectedFarmer.paidAmount) || 0;
                    const rem = totalCost - totalPaid;
                    return (
                        <>
                            <div className="text-xs">
                                <p className="text-gray-500">Total Cost: ₹{totalCost.toLocaleString()}</p>
                                <p className="text-green-600 font-bold">Total Paid: ₹{totalPaid.toLocaleString()}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-sm font-bold ${rem > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                Rem: ₹{rem.toLocaleString()}
                            </div>
                        </>
                    );
                })()}
            </div>
          </div>
        </div>
      )}

      {/* Pay Remaining Modal */}
      {showPayModal && selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">Give Remaining Money</h3>
               <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
                {(() => {
                    const total = (Number(selectedFarmer.paddyWeight) || 0) * (Number(selectedFarmer.ratePerQuintal) || 0);
                    const paid = Number(selectedFarmer.paidAmount) || 0;
                    const rem = total - paid;
                    return (
                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 mb-2">
                            <p className="text-xs text-red-600 font-medium">Pending Balance for {selectedFarmer.name}:</p>
                            <p className="text-xl font-bold text-red-700">₹{rem.toLocaleString()}</p>
                        </div>
                    );
                })()}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount (₹)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            required
                            type="number" 
                            min="1"
                            step="0.01"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                            className="input-field pl-9" 
                            placeholder="Enter positive amount"
                        />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Enter the amount you are giving to the farmer now.</p>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note (Optional)</label>
                    <input 
                        type="text" 
                        value={paymentNote}
                        onChange={e => setPaymentNote(e.target.value)}
                        className="input-field" 
                        placeholder="e.g. Paid by cash"
                    />
                </div>
                <div className="pt-2 flex flex-col gap-2">
                    <button type="submit" disabled={submitting || !paymentAmount} className="btn-primary w-full flex items-center justify-center py-3">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Payment'}
                    </button>
                    <button type="button" onClick={() => setShowPayModal(false)} className="text-sm text-gray-500 py-1">Cancel</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farmers;
