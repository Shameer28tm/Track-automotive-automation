import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { appointmentsApi, vehiclesApi, authApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const BookAppointmentModal = ({ isOpen, onClose, onSaved }) => {
  const { user, isAdmin } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [formData, setFormData] = useState({
    vehicle: '',
    service_type: 'GENERAL_SERVICE',
    appointment_date: '',
    appointment_time: '09:00',
    notes: '',
    mechanic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Minimum date is tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        vehicle: '',
        service_type: 'GENERAL_SERVICE',
        appointment_date: minDateStr,
        appointment_time: '09:00',
        notes: '',
        mechanic: ''
      });
      setError('');

      vehiclesApi.list().then(res => {
        const vList = res.data.results || res.data || [];
        setVehicles(vList);
        if (vList.length > 0) {
          setFormData(prev => ({ ...prev, vehicle: vList[0].id }));
        }
      }).catch(err => console.error(err));

      if (isAdmin) {
        authApi.getMechanics().then(res => {
          setMechanics(res.data.results || res.data || []);
        }).catch(err => console.error(err));
      }
    }
  }, [isOpen, isAdmin, minDateStr]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.vehicle) {
      setError('Please select a registered vehicle.');
      return;
    }

    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.mechanic) delete payload.mechanic;

      await appointmentsApi.create(payload);
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        const msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        setError(`${firstKey}: ${msg}`);
      } else {
        setError('Failed to book appointment.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Book Service Appointment">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Select Vehicle *
          </label>
          {vehicles.length === 0 ? (
            <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
              No vehicles available. Please register a vehicle before booking service.
            </div>
          ) : (
            <select
              required
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.license_plate} — {v.year} {v.make} {v.model}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Requested Service Package *
          </label>
          <select
            value={formData.service_type}
            onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
          >
            <option value="GENERAL_SERVICE">General Maintenance Service</option>
            <option value="OIL_CHANGE">Engine Oil & Filter Change</option>
            <option value="BRAKE_INSPECTION">Brake System Inspection & Pad Replacement</option>
            <option value="ENGINE_DIAGNOSTICS">Engine Diagnostics & Computer Scan</option>
            <option value="TIRE_SUSPENSION">Tire Balancing & Suspension Check</option>
            <option value="ELECTRICAL">Battery & Electrical System Check</option>
            <option value="AIR_CONDITIONING">AC Inspection & Refrigerant Refill</option>
            <option value="OTHER">Other Custom Service</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Date *
            </label>
            <input
              type="date"
              required
              min={minDateStr}
              value={formData.appointment_date}
              onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Arrival Time *
            </label>
            <select
              value={formData.appointment_time}
              onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="08:30:00">08:30 AM</option>
              <option value="09:00:00">09:00 AM</option>
              <option value="09:30:00">09:30 AM</option>
              <option value="10:00:00">10:00 AM</option>
              <option value="10:30:00">10:30 AM</option>
              <option value="11:00:00">11:00 AM</option>
              <option value="13:30:00">01:30 PM</option>
              <option value="14:00:00">02:00 PM</option>
              <option value="14:30:00">02:30 PM</option>
              <option value="15:00:00">03:00 PM</option>
              <option value="15:30:00">03:30 PM</option>
              <option value="16:00:00">04:00 PM</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Assign Dedicated Mechanic (Optional)
            </label>
            <select
              value={formData.mechanic}
              onChange={(e) => setFormData({ ...formData, mechanic: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Assign Later --</option>
              {mechanics.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.email}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Symptoms Description
          </label>
          <textarea
            rows="3"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Describe any warning lights, noises, vibrations, or particular requests..."
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || vehicles.length === 0}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookAppointmentModal;
