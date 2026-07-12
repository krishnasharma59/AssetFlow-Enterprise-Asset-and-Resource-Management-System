import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AssetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [history, setHistory] = useState({ allocations: [], maintenance: [] });
  const [loading, setLoading] = useState(true);
  const canManage = ['Admin', 'AssetManager'].includes(user?.role);

  const load = () => {
    setLoading(true);
    Promise.all([api.get(`/assets/${id}`), api.get(`/assets/${id}/history`)])
      .then(([assetRes, historyRes]) => {
        setAsset(assetRes.data);
        setHistory(historyRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleStatusChange = async (status) => {
    try {
      await api.patch(`/assets/${id}/status`, { status });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update status');
    }
  };

  if (loading || !asset) {
    return (
      <AppLayout title="Asset detail">
        <p className="text-slate-400 text-sm">Loading...</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={`${asset.assetTag} · ${asset.name}`}>
      <button onClick={() => navigate('/assets')} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={16} /> Back to directory
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 card p-5 space-y-3">
          {asset.photoUrl && (
            <img src={asset.photoUrl} alt={asset.name} className="w-full h-40 object-cover rounded-lg mb-2" />
          )}
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Status</span><StatusBadge status={asset.status} /></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Category</span><span className="text-sm font-medium">{asset.category?.name}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Serial No.</span><span className="text-sm font-medium">{asset.serialNumber || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Condition</span><span className="text-sm font-medium">{asset.condition}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Location</span><span className="text-sm font-medium">{asset.location || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Department</span><span className="text-sm font-medium">{asset.department?.name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Acquired</span><span className="text-sm font-medium">{fmtDate(asset.acquisitionDate)}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Cost (reporting)</span><span className="text-sm font-medium">₹{asset.acquisitionCost?.toLocaleString() || 0}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Bookable resource</span><span className="text-sm font-medium">{asset.isBookable ? 'Yes' : 'No'}</span></div>
          <div className="flex justify-between"><span className="text-slate-500 text-sm">Held by</span><span className="text-sm font-medium">{asset.currentHolderUser?.name || asset.currentHolderDepartment?.name || '—'}</span></div>

          {canManage && asset.status === 'Available' && (
            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => handleStatusChange('Retired')}>Mark Retired</button>
              <button className="btn-secondary" onClick={() => handleStatusChange('Disposed')}>Mark Disposed</button>
              <button className="btn-secondary" onClick={() => handleStatusChange('Lost')}>Mark Lost</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Allocation history</h2>
            <DataTable
              emptyMessage="This asset hasn't been allocated yet."
              columns={[
                { key: 'holder', label: 'Holder', render: (r) => r.allocatedToUser?.name || r.allocatedToDepartment?.name || '—' },
                { key: 'from', label: 'From', render: (r) => fmtDate(r.allocationDate) },
                { key: 'expected', label: 'Expected return', render: (r) => fmtDate(r.expectedReturnDate) },
                { key: 'actual', label: 'Actual return', render: (r) => fmtDate(r.actualReturnDate) },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'by', label: 'Allocated by', render: (r) => r.allocatedBy?.name || '—' },
              ]}
              rows={history.allocations}
            />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900 mb-3">Maintenance history</h2>
            <DataTable
              emptyMessage="No maintenance requests raised for this asset."
              columns={[
                { key: 'issue', label: 'Issue', render: (r) => r.issueDescription },
                { key: 'priority', label: 'Priority' },
                { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
                { key: 'raisedBy', label: 'Raised by', render: (r) => r.raisedBy?.name || '—' },
                { key: 'raised', label: 'Raised on', render: (r) => fmtDate(r.createdAt) },
                { key: 'resolved', label: 'Resolved on', render: (r) => fmtDate(r.resolvedAt) },
              ]}
              rows={history.maintenance}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
