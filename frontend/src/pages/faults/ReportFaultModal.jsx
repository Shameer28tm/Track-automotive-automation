import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { faultsApi, vehiclesApi } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const ReportFaultModal = ({ isOpen, onClose, onSaved }) => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({
    vehicle: '',
    description: '',
    severity: 'MEDIUM',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ vehicle: '', description: '', severity: 'MEDIUM' });
      setError('');
      vehiclesApi.list().then(res => {
        const vList = res.data.results || res.data || [];
        setVehicles(vList);
        if (vList.length > 0) {
          setFormData(prev => ({ ...prev, vehicle: vList[0].id }));
        }
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.vehicle) {
      setError('Please choose a vehicle.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await faultsApi.create(formData);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to report vehicle fault.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Vehicle Issue or Fault">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select Affected Vehicle *</label>
          <select
            required
            value={formData.vehicle}
            onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.license_plate} — {v.year} {v.make} {v.model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Severity *</label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
          >
            <option value="LOW">Low (Minor cosmetic / non-critical annoyance)</option>
            <option value="MEDIUM">Medium (Noticeable noise, vibration, or warning light)</option>
            <option value="HIGH">High (Degraded drivability or brake/engine issues)</option>
            <option value="CRITICAL">Critical (Immediate safety risk / do not drive)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Detailed Symptom Description *
          </label>
          <textarea
            rows="4"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe what you hear, feel, or see: when does it happen? Any dashboard warning codes or fluid leaks?"
            className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || vehicles.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Submit Fault Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportFaultModal;
