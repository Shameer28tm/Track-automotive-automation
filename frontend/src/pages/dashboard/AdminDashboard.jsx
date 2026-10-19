import React, { useState, useEffect } from 'react';
import { Users, Car, CalendarCheck, Wrench, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { servicesApi } from '../../api/client';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await servicesApi.getDashboardSummary();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load admin dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  const stats = data?.stats || {};
  const recentAppointments = data?.recent_appointments || [];
  const recentJobs = data?.recent_jobs || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Garage Administration Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live operational metrics and service activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/appointments"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
          >
            Manage Appointments
          </Link>
          <Link
            to="/services"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors"
          >
            New Repair Job
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={stats.total_customers || 0}
          icon={Users}
          color="purple"
          description="Registered garage clients"
        />
        <StatCard
          title="Registered Vehicles"
          value={stats.total_vehicles || 0}
          icon={Car}
          color="blue"
          description="Active client fleet"
        />
        <StatCard
          title="Pending Requests"
          value={stats.pending_appointments || 0}
          icon={Clock}
          color="amber"
          description="Awaiting confirmation"
        />
        <StatCard
          title="Jobs In Progress"
          value={stats.jobs_in_progress || 0}
          icon={Wrench}
          color="emerald"
          description="Active on service bays"
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Completed Services</p>
            <p className="text-xl font-bold text-slate-900">{stats.completed_jobs || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Active Mechanics</p>
            <p className="text-xl font-bold text-slate-900">{stats.total_mechanics || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Unresolved Faults</p>
            <p className="text-xl font-bold text-slate-900">{stats.unresolved_faults || 0}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Split view: Recent Appointments & Active Jobs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              Recent Appointments
            </h3>
            <Link to="/appointments" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentAppointments.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No appointments scheduled.</p>
            ) : (
              recentAppointments.map((app) => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{app.vehicle} • {app.service_type}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Client: {app.customer} | Scheduled: {app.date}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Repair Jobs */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-emerald-600" />
              Recent Repair Jobs
            </h3>
            <Link to="/services" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              View all
            </Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {recentJobs.length === 0 ? (
              <p className="p-6 text-center text-xs text-slate-400">No repair jobs created yet.</p>
            ) : (
              recentJobs.map((job) => (
                <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{job.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Plate: {job.vehicle} | Mechanic: {job.mechanic}
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={job.status} />
                    <p className="text-xs font-bold text-slate-900 mt-1">${job.total}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
