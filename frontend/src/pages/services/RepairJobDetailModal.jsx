import React, { useState, useEffect } from 'react';
import Modal from '../../components/common/Modal';
import { servicesApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Plus, Check, Wrench, Shield } from 'lucide-react';

export const RepairJobDetailModal = ({ isOpen, onClose, job, onSaved }) => {
  const { user, isAdmin, isMechanic } = useAuth();
  const [formData, setFormData] = useState({
    status: 'QUEUED',
    labor_fee: 0,
    action_taken: '',
    mechanic_notes: '',
    next_service_km: '',
    next_service_advice: '',
  });

  const [partData, setPartData] = useState({
    part_name: '',
    part_number: '',
    unit_price: '',
    quantity: 1,
  });

  const [inspData, setInspData] = useState({
    item_name: '',
    result: '',
    status: 'PASS',
    recommendation: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (job) {
      setFormData({
        status: job.status || 'QUEUED',
        labor_fee: job.labor_fee || 0,
        action_taken: job.action_taken || '',
        mechanic_notes: job.mechanic_notes || '',
        next_service_km: job.next_service_km || '',
        next_service_advice: job.next_service_advice || '',
      });
    }
  }, [job]);

  if (!job) return null;

  const canEdit = isAdmin || (isMechanic && job.mechanic === user.id);

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await servicesApi.updateJob(job.id, formData);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update repair job.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!partData.part_name || !partData.unit_price) return;
    try {
      await servicesApi.addPart(job.id, partData);
      setPartData({ part_name: '', part_number: '', unit_price: '', quantity: 1 });
      onSaved();
    } catch (err) {
      alert("Error adding part: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleAddInspection = async (e) => {
    e.preventDefault();
    if (!inspData.item_name || !inspData.result) return;
    try {
      await servicesApi.addInspection(job.id, inspData);
      setInspData({ item_name: '', result: '', status: 'PASS', recommendation: '' });
      onSaved();
    } catch (err) {
      alert("Error adding inspection item: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Repair Ticket #${job.id}: ${job.title}`} maxWidth="max-w-3xl">
      <div className="space-y-6 text-xs">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Vehicle & Customer Overview */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Vehicle</p>
            <p className="font-bold text-slate-900 text-sm">{job.vehicle_plate}</p>
            <p className="text-slate-600">{job.vehicle_details?.year} {job.vehicle_details?.make} {job.vehicle_details?.model}</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase text-[10px]">Client & Mechanic</p>
            <p className="font-semibold text-slate-800">Client: {job.customer_name || job.customer_email}</p>
            <p className="text-slate-600">Assigned: {job.mechanic_name || 'Unassigned'}</p>
          </div>
        </div>

        {/* Existing Parts List */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2 flex items-center justify-between">
            <span>Parts & Materials ({job.parts?.length || 0})</span>
            <span className="font-semibold text-blue-600">Subtotal: ${job.parts_subtotal}</span>
          </h4>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {job.parts?.length === 0 ? (
              <p className="p-3 text-center text-slate-400">No replacement parts logged yet.</p>
            ) : (
              job.parts?.map((p) => (
                <div key={p.id} className="p-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{p.part_name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({p.part_number || 'N/A'})</span>
                  </div>
                  <div className="font-mono text-slate-700">
                    {p.quantity} x ${p.unit_price} = <strong>${p.total_amount}</strong>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Part Form (If permitted) */}
          {canEdit && (
            <form onSubmit={handleAddPart} className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Part Name *"
                required
                value={partData.part_name}
                onChange={(e) => setPartData({ ...partData, part_name: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Part Number"
                value={partData.part_number}
                onChange={(e) => setPartData({ ...partData, part_number: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price ($) *"
                required
                value={partData.unit_price}
                onChange={(e) => setPartData({ ...partData, unit_price: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={partData.quantity}
                  onChange={(e) => setPartData({ ...partData, quantity: parseInt(e.target.value) || 1 })}
                  className="text-xs p-2 border border-slate-300 rounded-lg w-16"
                />
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Existing Inspections */}
        <div>
          <h4 className="font-bold text-slate-900 mb-2">Multipoint Inspection Items ({job.inspections?.length || 0})</h4>
          <div className="space-y-1.5">
            {job.inspections?.length === 0 ? (
              <p className="p-3 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">No inspection checkpoints recorded.</p>
            ) : (
              job.inspections?.map((insp) => (
                <div key={insp.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{insp.item_name}</span>
                    <span className="text-[11px] text-slate-500 ml-2">Result: {insp.result}</span>
                    {insp.recommendation && (
                      <span className="text-[11px] text-blue-600 ml-2">Note: {insp.recommendation}</span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    insp.status === 'PASS' ? 'bg-emerald-100 text-emerald-800' :
                    insp.status === 'ATTENTION' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {insp.status}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Quick Add Inspection Form */}
          {canEdit && (
            <form onSubmit={handleAddInspection} className="mt-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Checkpoint (e.g. Brake Fluid) *"
                required
                value={inspData.item_name}
                onChange={(e) => setInspData({ ...inspData, item_name: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="Result (e.g. Clean, 1% H2O) *"
                required
                value={inspData.result}
                onChange={(e) => setInspData({ ...inspData, result: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              />
              <select
                value={inspData.status}
                onChange={(e) => setInspData({ ...inspData, status: e.target.value })}
                className="text-xs p-2 border border-slate-300 rounded-lg"
              >
                <option value="PASS">Pass</option>
                <option value="ATTENTION">Needs Attention</option>
                <option value="FAIL">Failed</option>
              </select>
              <button
                type="submit"
                className="bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Log Item
              </button>
            </form>
          )}
        </div>

        {/* Update Job Form */}
        {canEdit ? (
          <form onSubmit={handleUpdateJob} className="space-y-3.5 pt-4 border-t border-slate-200">
            <h4 className="font-bold text-slate-900">Update Service Progress & Advice</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ticket Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                >
                  <option value="QUEUED">Queued</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="WAITING_PARTS">Waiting for Parts</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Labor Fee ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.labor_fee}
                  onChange={(e) => setFormData({ ...formData, labor_fee: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Action Taken / Service Summary</label>
              <textarea
                rows="2"
                value={formData.action_taken}
                onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                placeholder="Details of repair steps completed..."
                className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Service Mileage (km)</label>
                <input
                  type="number"
                  value={formData.next_service_km}
                  onChange={(e) => setFormData({ ...formData, next_service_km: e.target.value })}
                  placeholder="e.g. 40000"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Service Advice</label>
                <input
                  type="text"
                  value={formData.next_service_advice}
                  onChange={(e) => setFormData({ ...formData, next_service_advice: e.target.value })}
                  placeholder="e.g. Replace rear brake pads"
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Save Ticket Updates'}
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-3 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RepairJobDetailModal;
