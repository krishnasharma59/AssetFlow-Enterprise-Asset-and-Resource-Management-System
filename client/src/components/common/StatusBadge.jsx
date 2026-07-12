import React from 'react';

const COLOR_MAP = {
  // Asset lifecycle
  Available: 'bg-emerald-100 text-emerald-800',
  Allocated: 'bg-blue-100 text-blue-800',
  Reserved: 'bg-indigo-100 text-indigo-800',
  'Under Maintenance': 'bg-amber-100 text-amber-800',
  Lost: 'bg-red-100 text-red-800',
  Retired: 'bg-slate-200 text-slate-700',
  Disposed: 'bg-slate-300 text-slate-800',
  // Booking
  Upcoming: 'bg-blue-100 text-blue-800',
  Ongoing: 'bg-emerald-100 text-emerald-800',
  Completed: 'bg-slate-200 text-slate-700',
  Cancelled: 'bg-red-100 text-red-800',
  // Maintenance / Transfer / Audit
  Pending: 'bg-amber-100 text-amber-800',
  Requested: 'bg-amber-100 text-amber-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Rejected: 'bg-red-100 text-red-800',
  'Technician Assigned': 'bg-indigo-100 text-indigo-800',
  'In Progress': 'bg-blue-100 text-blue-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Transferred: 'bg-slate-200 text-slate-700',
  Returned: 'bg-slate-200 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-800',
  Planned: 'bg-slate-200 text-slate-700',
  Closed: 'bg-slate-300 text-slate-800',
  Verified: 'bg-emerald-100 text-emerald-800',
  Missing: 'bg-red-100 text-red-800',
  Damaged: 'bg-amber-100 text-amber-800',
};

export default function StatusBadge({ status }) {
  const classes = COLOR_MAP[status] || 'bg-slate-100 text-slate-700';
  return <span className={`badge ${classes}`}>{status}</span>;
}
