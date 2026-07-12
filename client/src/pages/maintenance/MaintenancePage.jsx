import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function MaintenancePage() {
  const { user } = useAuth(); const manager = ['Admin', 'AssetManager'].includes(user?.role);
  const [requests, setRequests] = useState([]); const [assets, setAssets] = useState([]); const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ assetId: '', issueDescription: '', priority: 'Medium', photoUrl: '' }); const [error, setError] = useState('');
  const load = () => Promise.all([api.get('/maintenance'), api.get('/assets')]).then(([r, a]) => { setRequests(r.data); setAssets(a.data.filter((x) => !['Disposed', 'Retired'].includes(x.status))); });
  useEffect(() => { load(); }, []);
  const submit = async (e) => { e.preventDefault(); try { await api.post('/maintenance', form); setOpen(false); setForm({ assetId: '', issueDescription: '', priority: 'Medium', photoUrl: '' }); load(); } catch (err) { setError(err.response?.data?.message || 'Could not create request'); } };
  const action = async (id, path, body = {}) => { try { await api.patch(`/maintenance/${id}/${path}`, body); load(); } catch (err) { window.alert(err.response?.data?.message || 'Action failed'); } };
  return <AppLayout title="Maintenance Management"><div className="flex justify-between mb-5"><p className="text-sm text-slate-500">Requests require approval before an asset enters maintenance.</p><button className="btn-primary" onClick={() => { setError(''); setOpen(true); }}><PlusCircle size={16}/> Raise request</button></div>
    <DataTable rows={requests} emptyMessage="No maintenance requests." columns={[
      { key: 'asset', label: 'Asset', render: (r) => `${r.asset?.assetTag || ''} · ${r.asset?.name || ''}` }, { key: 'issueDescription', label: 'Issue' }, { key: 'priority', label: 'Priority' }, { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status}/> },
      { key: 'actions', label: '', render: (r) => manager && <div className="flex gap-2">{r.status === 'Pending' && <><button className="text-brand-600 text-sm" onClick={() => action(r._id, 'decision', { decision: 'Approved' })}>Approve</button><button className="text-red-600 text-sm" onClick={() => action(r._id, 'decision', { decision: 'Rejected' })}>Reject</button></>}{r.status === 'Approved' && <button className="text-brand-600 text-sm" onClick={() => action(r._id, 'assign-technician', { technicianName: window.prompt('Technician name') || 'Unassigned' })}>Assign</button>}{r.status === 'Technician Assigned' && <button className="text-brand-600 text-sm" onClick={() => action(r._id, 'start')}>Start</button>}{['Technician Assigned', 'In Progress'].includes(r.status) && <button className="text-brand-600 text-sm" onClick={() => action(r._id, 'resolve', { resolutionNotes: window.prompt('Resolution notes') || '' })}>Resolve</button>}</div> },
    ]}/>
    <Modal open={open} onClose={() => setOpen(false)} title="Raise maintenance request"><form onSubmit={submit} className="space-y-4">{error && <p className="text-sm text-red-600">{error}</p>}<select required className="input" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })}><option value="">Select asset</option>{assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} — {a.name}</option>)}</select><textarea required minLength={10} maxLength={2000} className="input" rows="4" placeholder="Describe the issue (10–2000 characters)" value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })}/><select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>{['Low','Medium','High','Critical'].map((v) => <option key={v}>{v}</option>)}</select><input type="url" maxLength={2048} className="input" placeholder="Photo URL (optional)" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}/><button className="btn-primary w-full">Submit request</button></form></Modal>
  </AppLayout>;
}
