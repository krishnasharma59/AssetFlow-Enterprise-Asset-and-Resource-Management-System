import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Boxes,
  CheckCircle2,
  Wrench,
  CalendarClock,
  ArrowLeftRight,
  Clock,
  PlusCircle,
  AlertTriangle,
} from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import KpiCard from '../components/common/KpiCard';
import DataTable from '../components/common/DataTable';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const kpis = data?.kpis || {};

  return (
    <AppLayout title={`Hi ${user?.name?.split(' ')[0] || ''}, here's what's happening`}>
      <div className="flex flex-wrap gap-3 mb-6">
        <button className="btn-primary" onClick={() => navigate('/assets?register=1')}>
          <PlusCircle size={16} /> Register Asset
        </button>
        <button className="btn-secondary" onClick={() => navigate('/bookings?new=1')}>
          <CalendarClock size={16} /> Book Resource
        </button>
        <button className="btn-secondary" onClick={() => navigate('/maintenance?new=1')}>
          <Wrench size={16} /> Raise Maintenance Request
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading dashboard...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
            <KpiCard label="Assets Available" value={kpis.assetsAvailable ?? 0} icon={CheckCircle2} tone="green" onClick={() => navigate('/assets?status=Available')} />
            <KpiCard label="Assets Allocated" value={kpis.assetsAllocated ?? 0} icon={Boxes} tone="brand" onClick={() => navigate('/assets?status=Allocated')} />
            <KpiCard label="Maintenance Today" value={kpis.maintenanceToday ?? 0} icon={Wrench} tone="amber" onClick={() => navigate('/maintenance')} />
            <KpiCard label="Active Bookings" value={kpis.activeBookings ?? 0} icon={CalendarClock} tone="brand" onClick={() => navigate('/bookings')} />
            <KpiCard label="Pending Transfers" value={kpis.pendingTransfers ?? 0} icon={ArrowLeftRight} tone="amber" onClick={() => navigate('/allocations?tab=transfers')} />
            <KpiCard label="Upcoming Returns" value={kpis.upcomingReturns ?? 0} icon={Clock} tone="slate" onClick={() => navigate('/allocations')} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={18} className="text-red-500" />
                <h2 className="font-semibold text-slate-900">Overdue returns</h2>
                <span className="badge bg-red-100 text-red-700">{kpis.overdueReturns ?? 0}</span>
              </div>
              <DataTable
                emptyMessage="No overdue returns - nice and tidy."
                columns={[
                  { key: 'asset', label: 'Asset', render: (r) => `${r.asset?.assetTag} · ${r.asset?.name}` },
                  { key: 'holder', label: 'Held by', render: (r) => r.allocatedToUser?.name || r.allocatedToDepartment?.name || '-' },
                  { key: 'due', label: 'Was due', render: (r) => <span className="text-red-600">{fmtDate(r.expectedReturnDate)}</span> },
                ]}
                rows={data?.overdueAllocations || []}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={18} className="text-slate-500" />
                <h2 className="font-semibold text-slate-900">Upcoming returns (next 7 days)</h2>
              </div>
              <DataTable
                emptyMessage="Nothing due back this week."
                columns={[
                  { key: 'asset', label: 'Asset', render: (r) => `${r.asset?.assetTag} · ${r.asset?.name}` },
                  { key: 'holder', label: 'Held by', render: (r) => r.allocatedToUser?.name || r.allocatedToDepartment?.name || '-' },
                  { key: 'due', label: 'Due', render: (r) => fmtDate(r.expectedReturnDate) },
                ]}
                rows={data?.upcomingReturnsList || []}
              />
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
