import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/reports/dashboard');
        setData(data);
      } catch (err) {
        console.error('Error fetching dashboard', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="min-h-[400px] flex items-center justify-center"><Loader2 className="animate-spin text-primary-500 h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin. Here's what's happening today.</p>
      </div>
      
      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Today's Sales", value: `₹${(data?.todaySalesTotal || 0).toLocaleString()}`, change: null },
          { label: "Today's Profit", value: `₹${(data?.todayProfit || 0).toLocaleString()}`, change: null },
          { label: "Total Farmers", value: data?.totalFarmers || 0, change: null },
          { label: "Available Stock (kg)", value: (data?.totalStockAvailable || 0).toLocaleString(), change: null },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
            <dt className="text-sm font-medium text-gray-500 truncate">{stat.label}</dt>
            <dd className="mt-2 text-3xl font-semibold text-gray-900">{stat.value}</dd>
            {stat.change && (
              <span className={`text-sm mt-2 font-medium ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
                {stat.change} <span className="text-gray-400 font-normal ml-1">from yesterday</span>
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Charts / Data Row placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue over Time</h2>
          <div className="bg-gray-50 h-[calc(100%-2rem)] rounded-xl w-full flex items-center justify-center border border-dashed border-gray-200">
             <span className="text-gray-400 font-medium">[ Revenue Chart Widget Coming Soon ]</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[400px]">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="bg-white h-[calc(100%-2rem)] w-full flex flex-col gap-3">
             <a href="/farmers" className="p-4 rounded-xl border border-gray-100 hover:border-primary-500 hover:shadow-sm transition-all flex justify-between items-center group cursor-pointer">
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">Add New Farmer</h4>
                  <p className="text-sm text-gray-500">Register paddy from suppliers</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 text-gray-400 group-hover:text-primary-600">→</div>
             </a>
             <a href="/sales" className="p-4 rounded-xl border border-gray-100 hover:border-primary-500 hover:shadow-sm transition-all flex justify-between items-center group cursor-pointer">
                <div>
                  <h4 className="font-semibold text-gray-900 group-hover:text-primary-600">Record Sale</h4>
                  <p className="text-sm text-gray-500">Sell rice to customers</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 text-gray-400 group-hover:text-primary-600">→</div>
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
