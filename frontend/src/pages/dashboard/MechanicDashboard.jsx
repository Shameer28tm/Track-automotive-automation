import React, { useState, useEffect } from 'react';
import { Wrench, CalendarCheck, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { servicesApi } from '../../api/client';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const MechanicDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await servicesApi.getDashboardSummary();
        setData(res.data);
      } catch (err) {
        console.error("Failed to load mechanic dashboard summary:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  if (loading) return <div className="py-20"><LoadingSpinner size="lg" /></div>;

  const stats = data?.stats || {};
  const recentJobs = data?.recent_jobs || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Mechanic Workstation</h2>
          <p className="text-xs text-slate-500 mt-0.5">Assigned repair orders, scheduled jobs, and diagnostics</p>
        </div>
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
        >
          <span>Open My Repair Jobs</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Jobs"
          value={stats.total_assigned_jobs || 0}
          icon={Wrench}
          color="blue"
          description="Total repair tickets"
        />
        <StatCard
          title="In Progress"
          value={stats.jobs_in_progress || 0}
          icon={Clock}
          color="amber"
          description="Active repair bay work"
        />
        <StatCard
          title="Upcoming Appointments"
          value={stats.upcoming_appointments || 0}
          icon={CalendarCheck}
          color="purple"
          description="Assigned client arrivals"
        />
        <StatCard
          title="Assigned Faults"
          value={stats.assigned_faults || 0}
          icon={AlertTriangle}
          color="rose"
          description="Diagnostics pending"
        />
      </div>

      {/* Assigned Jobs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            My Active Service Jobs
          </h3>
          <Link to="/services" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Manage all
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {recentJobs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              You currently have no service jobs assigned. Check back once garage admin assigns tickets.
            </div>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-slate-900">{job.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Vehicle: {job.vehicle}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={job.status} />
                  <Link
                    to={`/services`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    View / Update
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MechanicDashboard;
