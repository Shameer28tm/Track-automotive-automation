import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { vehiclesApi, authApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const VehicleModal = ({ isOpen, onClose, vehicle = null, onSaved }) => {
  const { isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    license_plate: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    vehicle_type: 'SEDAN',
    fuel_type: 'PETROL',
    chassis_number: '',
    current_mileage: 0,
    notes: '',
    owner: ''
  });
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        color: vehicle.color || '',
        vehicle_type: vehicle.vehicle_type || 'SEDAN',
        fuel_type: vehicle.fuel_type || 'PETROL',
        chassis_number: vehicle.chassis_number || '',
        current_mileage: vehicle.current_mileage || 0,
        notes: vehicle.notes || '',
        owner: vehicle.owner || ''
      });
    } else {
      setFormData({
        license_plate: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
        vehicle_type: 'SEDAN',
        fuel_type: 'PETROL',
        chassis_number: '',
        current_mileage: 0,
        notes: '',
        owner: ''
      });
    }
  }, [vehicle, isOpen]);

  useEffect(() => {
    if (isAdmin && isOpen) {
      authApi.getUsers({ role: 'CUSTOMER' }).then(res => {
        setCustomers(res.data.results || res.data || []);
      }).catch(err => console.error("Could not fetch customer list:", err));
    }
  }, [isAdmin, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { ...formData };
      if (!isAdmin || !payload.owner) {
        delete payload.owner;
      }

      if (vehicle) {
        await vehiclesApi.update(vehicle.id, payload);
      } else {
        await vehiclesApi.create(payload);
      }
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
        setError('Failed to save vehicle details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
            {error}
          </div>
        )}

        {isAdmin && !vehicle && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Vehicle Owner (Customer)
            </label>
            <select
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Assign Owner (Default: Self) --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name || c.email} ({c.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Registration Number / License Plate *
            </label>
            <input
              type="text"
              required
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value.toUpperCase() })}
              placeholder="e.g. KAB-1024"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Manufacturing Year *
            </label>
            <input
              type="number"
              required
              min="1900"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || '' })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Make / Manufacturer *
            </label>
            <input
              type="text"
              required
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              placeholder="e.g. Toyota"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Model *
            </label>
            <input
              type="text"
              required
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="e.g. RAV4"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Vehicle Body Type
            </label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="HATCHBACK">Hatchback</option>
              <option value="TRUCK">Truck / Pickup</option>
              <option value="VAN">Van</option>
              <option value="COUPE">Coupe</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fuel Type
            </label>
            <select
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            >
              <option value="PETROL">Petrol / Gasoline</option>
              <option value="DIESEL">Diesel</option>
              <option value="ELECTRIC">Electric (EV)</option>
              <option value="HYBRID">Hybrid</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Odometer Reading (km)
            </label>
            <input
              type="number"
              min="0"
              value={formData.current_mileage}
              onChange={(e) => setFormData({ ...formData, current_mileage: parseInt(e.target.value) || 0 })}
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Exterior Color
            </label>
            <input
              type="text"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="e.g. Metallic Grey"
              className="w-full text-xs rounded-xl border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Chassis Number / VIN
          </label>
          <input
            type="text"
            value={formData.chassis_number}
            onChange={(e) => setFormData({ ...formData, chassis_number: e.target.value.toUpperCase() })}
            placeholder="17-character VIN"
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-mono uppercase focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Notes / Special Service Requirements
          </label>
          <textarea
            rows="2"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Optional vehicle notes..."
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
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <LoadingSpinner size="sm" /> : vehicle ? 'Update Vehicle' : 'Save Vehicle'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default VehicleModal;
