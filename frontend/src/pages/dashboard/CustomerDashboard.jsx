import React, { useState, useEffect } from 'react';
import { Car, CalendarCheck, Wrench, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { servicesApi } from '../../api/client';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const CustomerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await servicesApi.getDashboardSummary();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load customer dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  const stats = data?.stats || {};
  const vehicles = data?.vehicles || [];
  const recentAppointments = data?.recent_appointments || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Customer Portal</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Book certified automotive services, track ongoing repairs in real-time, and view complete maintenance logs.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            to="/appointments"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </Link>
          <Link
            to="/vehicles"
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors"
          >
            Add Vehicle
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="My Vehicles"
          value={stats.vehicles_count || 0}
          icon={Car}
          color="blue"
          description="Registered cars"
        />
        <StatCard
          title="Upcoming Visits"
          value={stats.upcoming_appointments || 0}
          icon={CalendarCheck}
          color="emerald"
          description="Confirmed service slots"
        />
        <StatCard
          title="Active Repairs"
          value={stats.active_repairs || 0}
          icon={Wrench}
          color="amber"
          description="In bay service"
        />
        <StatCard
          title="Reported Faults"
          value={stats.reported_faults || 0}
          icon={AlertCircle}
          color="rose"
          description="Logged car issues"
        />
      </div>

      {/* Vehicles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <Car className="w-4 h-4 text-blue-600" />
            My Garage Vehicles
          </h3>
          <Link to="/vehicles" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Manage Vehicles
          </Link>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
            <Car className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">No vehicles registered under your account yet.</p>
            <Link
              to="/vehicles"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-semibold mt-2"
            >
              <span>Add your first car</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                    {v.plate}
                  </span>
                  <span className="text-[11px] text-slate-400">{v.mileage?.toLocaleString()} km</span>
                </div>
                <h4 className="font-semibold text-xs text-slate-900 truncate">{v.name}</h4>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <Link
                    to="/appointments"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Schedule Service
                  </Link>
                  <Link
                    to="/faults"
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Report Issue
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            Recent Service Appointments
          </h3>
          <Link to="/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentAppointments.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No scheduled appointments.</p>
          ) : (
            recentAppointments.map((app) => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{app.vehicle} • {app.service_type}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Date: {app.date}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
