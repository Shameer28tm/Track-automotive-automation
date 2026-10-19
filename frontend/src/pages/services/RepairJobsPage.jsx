import React, { useState, useEffect } from 'react';
import { Wrench, Plus, FileText, CheckCircle, Clock, AlertTriangle, Search } from 'lucide-react';
import { servicesApi, vehiclesApi, authApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReceiptModal from './ReceiptModal';
import RepairJobDetailModal from './RepairJobDetailModal';
import Modal from '../../components/common/Modal';

export const RepairJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [receiptJobId, setReceiptJobId] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [mechanics, setMechanics] = useState([]);

  const [createData, setCreateData] = useState({
    vehicle: '',
    mechanic: '',
    title: '',
    description: '',
    labor_fee: 0,
    status: 'QUEUED',
  });

  const { user, isAdmin, isMechanic } = useAuth();

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await servicesApi.listJobs(params);
      setJobs(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
    if (isAdmin) {
      vehiclesApi.list().then(res => setVehicles(res.data.results || res.data || []));
      authApi.getMechanics().then(res => setMechanics(res.data.results || res.data || []));
    }
  }, [statusFilter, isAdmin]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...createData };
      if (!payload.mechanic) delete payload.mechanic;
      await servicesApi.createJob(payload);
      setIsCreateOpen(false);
      setCreateData({ vehicle: '', mechanic: '', title: '', description: '', labor_fee: 0, status: 'QUEUED' });
      loadJobs();
    } catch (err) {
      alert("Error creating repair ticket: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Repair Jobs & Service Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Manage garage repair orders, labor charges, parts inventory, and printed invoices' : 'Track your vehicle repair progress and download transparent service receipts'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Open Repair Ticket</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 text-xs">
        {['', 'QUEUED', 'IN_PROGRESS', 'WAITING_PARTS', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace(/_/g, ' ') : 'All Service Tickets'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No repair jobs found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter ? `No jobs currently matching status ${statusFilter}.` : 'No service tickets currently active.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {job.vehicle_plate}
                  </span>
                  <StatusBadge status={job.status} />
                </div>

                <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{job.title}</h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{job.description}</p>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Client:</span>
                    <span className="font-medium text-slate-800">{job.customer_name || job.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assigned Mechanic:</span>
                    <span className="font-medium text-slate-800">{job.mechanic_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Parts Used:</span>
                    <span className="font-medium text-slate-800">{job.parts?.length || 0} items (${job.parts_subtotal})</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 text-sm font-bold text-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-blue-600">${job.total_amount_payable}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
                >
                  <Wrench className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inspect / Update</span>
                </button>
                <button
                  onClick={() => setReceiptJobId(job.id)}
                  className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Receipt</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isAdmin && (
        <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Open New Repair Ticket">
          <form onSubmit={handleCreateSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Vehicle *</label>
              <select
                required
                value={createData.vehicle}
                onChange={(e) => setCreateData({ ...createData, vehicle: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="">-- Choose Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.license_plate} — {v.year} {v.make} {v.model} ({v.owner_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Mechanic</label>
              <select
                value={createData.mechanic}
                onChange={(e) => setCreateData({ ...createData, mechanic: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="">-- Unassigned --</option>
                {mechanics.map((m) => (
                  <option key={m.id} value={m.id}>{m.full_name || m.email}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. 30,000KM Major Maintenance Service"
                value={createData.title}
                onChange={(e) => setCreateData({ ...createData, title: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Work Scope *</label>
              <textarea
                rows="2"
                required
                placeholder="Details of required diagnosis and service tasks..."
                value={createData.description}
                onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Labor Fee ($)</label>
              <input
                type="number"
                step="0.01"
                value={createData.labor_fee}
                onChange={(e) => setCreateData({ ...createData, labor_fee: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect / Update Modal */}
      {selectedJob && (
        <RepairJobDetailModal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
          onSaved={loadJobs}
        />
      )}

      {/* Printable Receipt Modal */}
      {receiptJobId && (
        <ReceiptModal
          isOpen={!!receiptJobId}
          onClose={() => setReceiptJobId(null)}
          jobId={receiptJobId}
        />
      )}
    </div>
  );
};

export default RepairJobsPage;
