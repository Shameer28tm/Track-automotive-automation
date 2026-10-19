import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Mail, Phone, Lock, User, Shield } from 'lucide-react';
import { authApi } from '../../api/client';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';

export const StaffPage = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone_number: '',
    role: 'MECHANIC',
    password: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await authApi.getUsers();
      const allUsers = res.data.results || res.data || [];
      // Filter mechanics and admins
      setStaff(allUsers.filter(u => u.role === 'MECHANIC' || u.role === 'ADMIN'));
    } catch (err) {
      console.error("Failed to load staff:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await authApi.createStaffUser(formData);
      setIsAddOpen(false);
      setFormData({ email: '', full_name: '', phone_number: '', role: 'MECHANIC', password: '' });
      loadStaff();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mechanics & Garage Staff</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage technician credentials, service assignments, and permissions</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Mechanic / Staff</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-blue-400 flex items-center justify-center font-bold text-sm">
                    {s.full_name ? s.full_name[0].toUpperCase() : s.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{s.full_name || 'Staff Member'}</h3>
                    <p className="text-[11px] text-slate-400">{s.email}</p>
                  </div>
                </div>
                <StatusBadge status={s.role} />
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-400" /> {s.email}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400" /> {s.phone_number || 'No direct phone'}</p>
                <p className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-slate-400" /> System Role: {s.role}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Mechanic or Garage Staff">
        <form onSubmit={handleCreateStaff} className="space-y-3.5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Assigned Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            >
              <option value="MECHANIC">Mechanic (Assigned repairs, diagnostics, parts)</option>
              <option value="ADMIN">Administrator (Full garage access)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Mike Vance"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="technician@trackautomotive.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="tel"
              placeholder="+1-555-0102"
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Initial Password (min 8 chars) *</label>
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
            >
              {submitting ? <LoadingSpinner size="sm" /> : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default StaffPage;
