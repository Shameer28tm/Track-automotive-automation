import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, CheckCircle, Clock, Wrench, ShieldAlert } from 'lucide-react';
import { faultsApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReportFaultModal from './ReportFaultModal';
import Modal from '../../components/common/Modal';

export const FaultsPage = () => {
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState({
    status: 'DIAGNOSED',
    diagnosis: '',
    resolution_notes: '',
  });

  const { user, isAdmin, isMechanic } = useAuth();

  const loadFaults = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await faultsApi.list(params);
      setFaults(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load faults:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaults();
  }, [statusFilter]);

  const handleOpenDiagnose = (fault) => {
    setSelectedFault(fault);
    setDiagnosisData({
      status: fault.status || 'DIAGNOSED',
      diagnosis: fault.diagnosis || '',
      resolution_notes: fault.resolution_notes || '',
    });
  };

  const handleSaveDiagnosis = async (e) => {
    e.preventDefault();
    try {
      await faultsApi.update(selectedFault.id, diagnosisData);
      setSelectedFault(null);
      loadFaults();
    } catch (err) {
      alert("Error saving diagnosis: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Vehicle Faults & Diagnostics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log unexpected vehicle symptoms, review mechanical diagnoses, and track defect resolutions
          </p>
        </div>
        <button
          onClick={() => setIsReportOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Report Vehicle Issue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 text-xs">
        {['', 'REPORTED', 'DIAGNOSED', 'IN_PROGRESS', 'RESOLVED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace(/_/g, ' ') : 'All Reported Faults'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : faults.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No fault reports logged</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter ? `No faults currently marked as ${statusFilter}.` : 'Your vehicles have no active issues recorded.'}
          </p>
          <button
            onClick={() => setIsReportOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Report an Issue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {faults.map((f) => (
            <div
              key={f.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                      {f.vehicle_plate}
                    </span>
                    <span className="font-semibold text-xs text-slate-800">{f.vehicle_info}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={f.severity} />
                    <StatusBadge status={f.status} />
                  </div>
                </div>

                <p className="text-xs text-slate-800 font-medium mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{f.description}"
                </p>

                {f.diagnosis && (
                  <div className="mt-3 p-3 bg-purple-50/70 border border-purple-100 rounded-xl text-xs">
                    <p className="font-bold text-purple-900 text-[11px] uppercase tracking-wider mb-0.5">
                      Mechanic Diagnosis
                    </p>
                    <p className="text-purple-800">{f.diagnosis}</p>
                  </div>
                )}

                {f.resolution_notes && (
                  <div className="mt-2.5 p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl text-xs">
                    <p className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider mb-0.5">
                      Resolution Applied
                    </p>
                    <p className="text-emerald-800">{f.resolution_notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Reported on: {new Date(f.date_reported).toLocaleDateString()}</span>
                {(isAdmin || isMechanic) && (
                  <button
                    onClick={() => handleOpenDiagnose(f)}
                    className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Diagnose / Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportFaultModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        onSaved={loadFaults}
      />

      {/* Diagnosis Modal for Staff */}
      {selectedFault && (
        <Modal
          isOpen={!!selectedFault}
          onClose={() => setSelectedFault(null)}
          title={`Diagnose Fault for ${selectedFault.vehicle_plate}`}
        >
          <form onSubmit={handleSaveDiagnosis} className="space-y-3.5 text-xs">
            <div>
              <p className="font-semibold text-slate-500 text-[10px] uppercase">Customer Complaint</p>
              <p className="text-slate-800 bg-slate-100 p-2.5 rounded-lg mt-1 italic">
                "{selectedFault.description}"
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Status</label>
              <select
                value={diagnosisData.status}
                onChange={(e) => setDiagnosisData({ ...diagnosisData, status: e.target.value })}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="REPORTED">Reported</option>
                <option value="DIAGNOSED">Diagnosed (Inspection Complete)</option>
                <option value="IN_PROGRESS">In Progress (Repair Underway)</option>
                <option value="RESOLVED">Resolved (Defect Fixed)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Diagnosis Findings</label>
              <textarea
                rows="3"
                value={diagnosisData.diagnosis}
                onChange={(e) => setDiagnosisData({ ...diagnosisData, diagnosis: e.target.value })}
                placeholder="Identified root cause (e.g. worn tie rod end, fouled spark plug, warped rotor)..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Resolution Notes</label>
              <textarea
                rows="2"
                value={diagnosisData.resolution_notes}
                onChange={(e) => setDiagnosisData({ ...diagnosisData, resolution_notes: e.target.value })}
                placeholder="Corrective actions taken to fix the issue..."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedFault(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                Save Diagnosis
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default FaultsPage;
