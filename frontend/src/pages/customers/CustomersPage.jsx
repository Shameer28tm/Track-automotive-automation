import React, { useState, useEffect } from 'react';
import { Users, Search, Car, Calendar, Mail, Phone } from 'lucide-react';
import { authApi } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadCustomers = async (q = search) => {
    setLoading(true);
    try {
      const res = await authApi.getUsers({ role: 'CUSTOMER', search: q });
      setCustomers(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    loadCustomers(search);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">Garage customer roster, vehicle fleets, and contact details</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name, email, or telephone number..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No customers found</h3>
          <p className="text-xs text-slate-400 mt-1">No customer accounts registered yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-3.5">Customer Name</th>
                <th className="px-6 py-3.5">Contact Details</th>
                <th className="px-6 py-3.5 text-center">Registered Fleet</th>
                <th className="px-6 py-3.5 text-right">Member Since</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                        {c.full_name ? c.full_name[0].toUpperCase() : c.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p>{c.full_name || 'No Name'}</p>
                        <p className="text-[11px] text-slate-400 font-normal">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {c.email}</p>
                      <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {c.phone_number || '—'}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      <Car className="w-3.5 h-3.5" />
                      {c.vehicles_count ?? '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
