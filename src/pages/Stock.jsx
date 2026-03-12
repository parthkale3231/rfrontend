import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2, Plus, X, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const Stock = () => {
  const [stockList, setStockList] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [newStock, setNewStock] = useState({ 
    riceType: '', 
    totalStock: '',
    soldQuantity: '',
    quantity: '' // For adding new stock
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stock');
      setStockList(data);
    } catch (err) {
      console.error('Error fetching stock', err);
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStock) {
        await api.put(`/stock/${editingStock._id}`, {
          riceType: newStock.riceType,
          totalStock: Number(newStock.totalStock),
          soldQuantity: Number(newStock.soldQuantity)
        });
        toast.success('Stock updated successfully!');
      } else {
        await api.post('/stock', { riceType: newStock.riceType, quantity: Number(newStock.quantity) });
        toast.success('Stock successfully added!');
      }
      setShowModal(false);
      resetForm();
      fetchStock();
    } catch (err) {
      console.error('Error updating stock', err);
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (stock) => {
    setEditingStock(stock);
    setNewStock({
      riceType: stock.riceType,
      totalStock: stock.totalStock,
      soldQuantity: stock.soldQuantity,
      quantity: ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingStock(null);
    setNewStock({ riceType: '', totalStock: '', soldQuantity: '', quantity: '' });
  };

  const handleDeleteStock = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock category? This will not delete associated sales but the category will disappear from inventory.')) {
        try {
            await api.delete(`/stock/${id}`);
            toast.success('Stock record deleted');
            fetchStock();
        } catch (err) {
            toast.error('Failed to delete stock');
        }
    }
  };

  // Compute grand total directly
  const totalRemaining = stockList.reduce((acc, curr) => acc + curr.remainingStock, 0);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Inventory Stock</h1>
          <p className="text-gray-500 mt-1">Monitor remaining rice inventory (Total: {totalRemaining || 0}kg).</p>
        </div>
        <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
          <Plus className="h-4 w-4" /> Add Processed Stock
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
         {/* Live stock cards */}
         {stockList.slice(0, 3).map(stock => (
           <div key={`summary-${stock._id}`} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col border-b-4 border-b-primary-500 hover:-translate-y-1 transition-transform cursor-default">
             <div className="flex justify-between items-center mb-2">
               <span className="font-semibold text-gray-900">{stock.riceType}</span>
               {stock.remainingStock < 500 && (
                 <span className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-md font-medium">Low Stock</span>
               )}
             </div>
             <span className="text-3xl font-bold tracking-tight text-gray-800">{stock.remainingStock} <span className="text-base text-gray-500 font-normal">kg</span></span>
             <div className="mt-4 pt-4 border-t border-gray-100 text-sm flex justify-between text-gray-500">
               <span>Total Added: {stock.totalStock}kg</span>
               <span>Sold: {stock.soldQuantity}kg</span>
             </div>
           </div>
         ))}
      </div>

      <div className="card max-w-full border border-gray-100 shadow-sm animate-fade-in">
        {loading ? (
             <div className="min-h-[300px] flex items-center justify-center">
               <Loader2 className="animate-spin text-primary-500 h-8 w-8" />
             </div>
          ) : stockList.length === 0 ? (
             <div className="flex flex-col items-center justify-center min-h-[300px] gap-2 text-gray-400 p-6">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <h3 className="text-lg font-medium text-gray-900">No inventory found</h3>
                <p className="text-sm">Click the button above to add rice stock.</p>
             </div>
          ) : (
          <div className="table-container">
            <table className="min-w-full text-left">
              <thead className="bg-gray-50 text-gray-700 text-sm border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold">Rice Type</th>
                  <th className="px-6 py-4 font-semibold text-right">Total Added</th>
                  <th className="px-6 py-4 font-semibold text-right">Sold Quantity</th>
                  <th className="px-6 py-4 font-semibold text-right">Remaining Stock</th>
                  <th className="px-6 py-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {stockList.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.riceType}</td>
                    <td className="px-6 py-4 text-gray-500 text-right">{item.totalStock} kg</td>
                    <td className="px-6 py-4 text-gray-500 text-right">{item.soldQuantity} kg</td>
                    <td className="px-6 py-4 text-right">
                       <span className={`font-semibold ${item.remainingStock < 500 ? 'text-red-600' : 'text-green-600'}`}>
                         {item.remainingStock} kg
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => handleEditClick(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDeleteStock(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                  <td className="px-6 py-4 text-gray-900">Total System Stock</td>
                  <td className="px-6 py-4 text-gray-700 text-right">
                     {stockList.reduce((acc, curr) => acc + curr.totalStock, 0)} kg
                  </td>
                  <td className="px-6 py-4 text-gray-700 text-right">
                     {stockList.reduce((acc, curr) => acc + curr.soldQuantity, 0)} kg
                  </td>
                  <td className="px-6 py-4 text-primary-700 text-right text-base">
                     {totalRemaining} kg
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          )}
      </div>

      {/* Add Stock Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
               <h3 className="text-lg font-semibold text-gray-900">{editingStock ? 'Edit Stock Adjustment' : 'Add Processed Rice'}</h3>
               <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
            </div>
            
            <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rice Type *</label>
                <input 
                  required
                  type="text" 
                  value={newStock.riceType}
                  onChange={e => setNewStock({...newStock, riceType: e.target.value})}
                  className="input-field" 
                  placeholder="E.g. Kolam, Basmati, Sona Masoori"
                  list="rice-types"
                />
                <datalist id="rice-types">
                  <option value="Kolam" />
                  <option value="Basmati" />
                  <option value="Sona Masoori" />
                  <option value="Indrayani" />
                </datalist>
                <p className="text-xs text-gray-500 mt-1">Type an existing name to add to current stock, or a new name to track a new variety.</p>
              </div>

              {editingStock ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Added Stock (kg) *</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={newStock.totalStock}
                      onChange={e => setNewStock({...newStock, totalStock: e.target.value})}
                      className="input-field" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Sold Quantity (kg) *</label>
                    <input 
                      required
                      type="number" 
                      min="0"
                      value={newStock.soldQuantity}
                      onChange={e => setNewStock({...newStock, soldQuantity: e.target.value})}
                      className="input-field" 
                    />
                    <p className="text-xs text-gray-500 mt-1">Carefully adjust this only to fix errors.</p>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Added (kg) *</label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={newStock.quantity}
                    onChange={e => setNewStock({...newStock, quantity: e.target.value})}
                    className="input-field" 
                    placeholder="E.g. 500"
                  />
                </div>
              )}
              
              <div className="pt-4 flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex items-center justify-center min-w-[100px]">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingStock ? 'Update Levels' : 'Log Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
