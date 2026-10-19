import React, { useState, useEffect } from 'react';
import { CalendarCheck, Plus, Check, X, Clock, User, Filter, AlertCircle } from 'lucide-react';
import { appointmentsApi, authApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import BookAppointmentModal from './BookAppointmentModal';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const { user, isAdmin, isMechanic } = useAuth();

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await appointmentsApi.list(params);
      setAppointments(res.data.results || res.data || []);
    } catch (err) {
      console.error("Failed to load appointments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    if (isAdmin) {
      authApi.getMechanics().then(res => {
        setMechanics(res.data.results || res.data || []);
      }).catch(err => console.error(err));
    }
  }, [statusFilter, isAdmin]);

  const handleStatusChange = async (appId, newStatus, mechanicId = null) => {
    try {
      const payload = { status: newStatus };
      if (mechanicId) payload.mechanic = mechanicId;
      await appointmentsApi.update(appId, payload);
      loadAppointments();
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleCancel = async (appId) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      try {
        await appointmentsApi.cancel(appId);
        loadAppointments();
      } catch (err) {
        alert("Failed to cancel: " + (err.response?.data?.detail || err.message));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Service Appointments</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Review customer bookings, assign mechanics, and confirm slots' : 'Track your scheduled automotive maintenance and repair visits'}
          </p>
        </div>
        <button
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-1.5 text-xs">
        {['', 'PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              statusFilter === st
                ? 'bg-slate-900 text-white font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st ? st.replace(/_/g, ' ') : 'All Appointments'}
          </button>
        ))}
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-20"><LoadingSpinner size="lg" /></div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {statusFilter ? `No appointments currently marked as ${statusFilter}.` : 'Schedule a service visit to inspect or repair your car.'}
          </p>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Book Appointment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {appointments.map((app) => (
              <div
                key={app.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-bold text-xs bg-slate-900 text-white px-2 py-0.5 rounded">
                      {app.vehicle_plate}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900">{app.vehicle_info || 'Vehicle'}</h4>
                    <StatusBadge status={app.status} />
                  </div>

                  <p className="text-xs font-semibold text-blue-700">
                    Service: {app.service_type?.replace(/_/g, ' ')}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {app.appointment_date} at {app.appointment_time?.slice(0, 5)}
                    </span>
                    {isAdmin && (
                      <span>Client: <strong className="text-slate-800">{app.customer_name || app.customer_email}</strong></span>
                    )}
                    <span>
                      Mechanic: <strong className="text-slate-800">{app.mechanic_name || 'Unassigned'}</strong>
                    </span>
                  </div>

                  {app.notes && (
                    <p className="text-xs text-slate-600 bg-slate-100/70 p-2 rounded-lg mt-1 italic">
                      "{app.notes}"
                    </p>
                  )}
                </div>

                {/* Status & Action Controls */}
                <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                  {/* Admin Confirmation Controls */}
                  {isAdmin && app.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => handleStatusChange(app.id, 'CONFIRMED', e.target.value || null)}
                        defaultValue=""
                        className="text-xs border border-slate-300 rounded-lg p-1.5 bg-white text-slate-700 focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="" disabled>Select Mechanic & Confirm</option>
                        {mechanics.map((m) => (
                          <option key={m.id} value={m.id}>
                            Assign: {m.full_name || m.email}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleStatusChange(app.id, 'CONFIRMED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1"
                        title="Confirm without assigning mechanic"
                      >
                        <Check className="w-3.5 h-3.5" /> Confirm
                      </button>
                    </div>
                  )}

                  {/* Admin Transition to IN_PROGRESS */}
                  {isAdmin && app.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleStatusChange(app.id, 'IN_PROGRESS')}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      Start Service Bay Work
                    </button>
                  )}

                  {/* Admin/Mechanic Mark Complete */}
                  {(isAdmin || isMechanic) && app.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleStatusChange(app.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    >
                      Mark Completed
                    </button>
                  )}

                  {/* Customer or Admin Cancellation */}
                  {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleCancel(app.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 text-slate-600 text-xs font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookAppointmentModal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        onSaved={loadAppointments}
      />
    </div>
  );
};

export default AppointmentsPage;
