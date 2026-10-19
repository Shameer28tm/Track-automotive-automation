import React from 'react';

export const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const styles = {
    // Appointments & Jobs
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
    QUEUED: 'bg-slate-100 text-slate-700 border-slate-200',
    IN_PROGRESS: 'bg-indigo-50 text-indigo-700 border-indigo-200 animate-pulse',
    WAITING_PARTS: 'bg-orange-50 text-orange-700 border-orange-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',

    // Faults
    REPORTED: 'bg-red-50 text-red-700 border-red-200',
    DIAGNOSED: 'bg-purple-50 text-purple-700 border-purple-200',
    RESOLVED: 'bg-teal-50 text-teal-700 border-teal-200',

    // Severity
    LOW: 'bg-slate-100 text-slate-600 border-slate-200',
    MEDIUM: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-100 text-red-800 border-red-300 font-bold',

    // Inspection
    PASS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ATTENTION: 'bg-amber-50 text-amber-700 border-amber-200',
    FAIL: 'bg-rose-50 text-rose-700 border-rose-200',

    // Roles
    ADMIN: 'bg-purple-50 text-purple-700 border-purple-200',
    MECHANIC: 'bg-blue-50 text-blue-700 border-blue-200',
    CUSTOMER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  const currentStyle = styles[normalized] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = status.replace(/_/g, ' ');

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentStyle}`}>
      {label}
    </span>
  );
};

export default StatusBadge;
