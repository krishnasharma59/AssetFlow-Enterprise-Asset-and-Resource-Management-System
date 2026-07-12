import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

function fmtDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AllocationPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'transfers' ? 'transfers' : 'allocations';
  const canAct = ['Admin', 'AssetManager', 'DepartmentHead'].includes(user?.role);

  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [allocateOpen, setAllocateOpen] = useState(false);
  const [allocateForm, setAllocateForm] = useState({ assetId: '', targetType: 'user', allocatedToUser: '', allocatedToDepartment: '', expectedReturnDate: '' });
  const [conflict, setConflict] = useState(null);
  const [error, setError] = useState('');

  const [returnModal, setReturnModal] = useState(null);
  const [returnForm, setReturnForm] = useState({ conditionOnReturn: '', returnNotes: '' });

  const [transferModal, setTransferModal] = useState(null);
  const [transferForm, setTransferForm] = useState({ targetType: 'user', toUser: '', toDepartment: '', reason: '', expectedReturnDate: '' });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/allocations'),
      api.get('/transfers'),
      api.get('/assets', { params: { status: 'Available' } }),
      api.get('/users'),
      api.get('/departments'),
    ]).then(([allocRes, transRes, assetRes, userRes, deptRes]) => {
      setAllocations(allocRes.data);
      setTransfers(transRes.data);
      setAssets(assetRes.data);
      setEmployees(userRes.data);
      setDepartments(deptRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const setTab = (t) => { searchParams.set('tab', t); setSearchParams(searchParams); };

  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');
    setConflict(null);
    try {
      await api.post('/allocations', {
        assetId: allocateForm.assetId,
        allocatedToUser: allocateForm.targetType === 'user' ? allocateForm.allocatedToUser : null,
        allocatedToDepartment: allocateForm.targetType === 'department' ? allocateForm.allocatedToDepartment : null,
        expectedReturnDate: allocateForm.expectedReturnDate || null,
      });
      setAllocateOpen(false);
      load();
    } catch (err) {
      if (err.response?.data?.code === 'ALREADY_ALLOCATED') {
        setConflict(err.response.data);
      } else {
        setError(err.response?.data?.message || 'Could not allocate asset');
      }
    }
  };

  const openTransferFromConflict = () => {
    setAllocateOpen(false);
    setTransferModal({ assetId: allocateForm.assetId, assetLabel: assets.find(a => a._id === allocateForm.assetId)?.assetTag });
    setTransferForm({ targetType: allocateForm.targetType, toUser: allocateForm.allocatedToUser, toDepartment: allocateForm.allocatedToDepartment, reason: '', expectedReturnDate: '' });
    setConflict(null);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    await api.post(`/allocations/${returnModal._id}/return`, returnForm);
    setReturnModal(null);
    setReturnForm({ conditionOnReturn: '', returnNotes: '' });
    load();
  };

  const handleRequestTransfer = async (e) => {
    e.preventDefault();
    await api.post('/transfers', {
      assetId: transferModal.assetId,
      toUser: transferForm.targetType === 'user' ? transferForm.toUser : null,
      toDepartment: transferForm.targetType === 'department' ? transferForm.toDepartment : null,
      reason: transferForm.reason,
      expectedReturnDate: transferForm.expectedReturnDate || null,
    });
    setTransferModal(null);
    load();
  };

  const decideTransfer = async (transfer, decision) => {
    await api.patch(`/transfers/${transfer._id}/decision`, { decision });
    load();
  };

  return (
    <AppLayout title="Asset Allocation & Transfer">
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-1 border-b border-slate-200 -mb-px">
          {[{ key: 'allocations', label: 'Active & Past Allocations' }, { key: 'transfers', label: 'Transfer Requests' }].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {canAct && tab === 'allocations' && (
          <button className="btn-primary" onClick={() => { setAllocateOpen(true); setConflict(null); setError(''); }}>
            <PlusCircle size={16} /> Allocate Asset
          </button>
        )}
      </div>

      {loading ? <p className="text-slate-400 text-sm">Loading...</p> : tab === 'allocations' ? (
        <DataTable
          emptyMessage="No allocations recorded yet."
          columns={[
            { key: 'asset', label: 'Asset', render: (r) => `${r.asset?.assetTag} · ${r.asset?.name || ''}` },
            { key: 'holder', label: 'Held by', render: (r) => r.allocatedToUser?.name || r.allocatedToDepartment?.name || '—' },
            { key: 'from', label: 'Allocated on', render: (r) => fmtDate(r.allocationDate) },
            { key: 'due', label: 'Expected return', render: (r) => fmtDate(r.expectedReturnDate) },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions', label: '',
              render: (r) => r.status === 'Active' && canAct ? (
                <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => setReturnModal(r)}>Mark returned</button>
              ) : null,
            },
          ]}
          rows={allocations}
        />
      ) : (
        <DataTable
          emptyMessage="No transfer requests yet."
          columns={[
            { key: 'asset', label: 'Asset', render: (r) => r.asset?.assetTag },
            { key: 'from', label: 'From', render: (r) => r.fromUser?.name || r.fromDepartment?.name || '—' },
            { key: 'to', label: 'To', render: (r) => r.toUser?.name || r.toDepartment?.name || '—' },
            { key: 'requestedBy', label: 'Requested by', render: (r) => r.requestedBy?.name || '—' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions', label: '',
              render: (r) => r.status === 'Requested' && canAct ? (
                <div className="flex gap-2">
                  <button className="text-emerald-600 text-sm font-medium hover:underline" onClick={() => decideTransfer(r, 'Approved')}>Approve</button>
                  <button className="text-red-600 text-sm font-medium hover:underline" onClick={() => decideTransfer(r, 'Rejected')}>Reject</button>
                </div>
              ) : null,
            },
          ]}
          rows={transfers}
        />
      )}

      {/* Allocate modal */}
      <Modal open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Allocate Asset">
        {conflict ? (
          <div className="space-y-4">
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-3">
              {conflict.message}
            </div>
            <button className="btn-primary w-full" onClick={openTransferFromConflict}>Raise a Transfer Request instead</button>
          </div>
        ) : (
          <form onSubmit={handleAllocate} className="space-y-4">
            {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
            <div>
              <label className="label">Asset</label>
              <select required className="input" value={allocateForm.assetId} onChange={(e) => setAllocateForm({ ...allocateForm, assetId: e.target.value })}>
                <option value="">Select an available asset</option>
                {assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} · {a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={allocateForm.targetType === 'user'} onChange={() => setAllocateForm({ ...allocateForm, targetType: 'user' })} /> Employee</label>
              <label className="flex items-center gap-2 text-sm"><input type="radio" checked={allocateForm.targetType === 'department'} onChange={() => setAllocateForm({ ...allocateForm, targetType: 'department' })} /> Department</label>
            </div>
            {allocateForm.targetType === 'user' ? (
              <div>
                <label className="label">Employee</label>
                <select required className="input" value={allocateForm.allocatedToUser} onChange={(e) => setAllocateForm({ ...allocateForm, allocatedToUser: e.target.value })}>
                  <option value="">Select employee</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="label">Department</label>
                <select required className="input" value={allocateForm.allocatedToDepartment} onChange={(e) => setAllocateForm({ ...allocateForm, allocatedToDepartment: e.target.value })}>
                  <option value="">Select department</option>
                  {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="label">Expected return date (optional)</label>
              <input type="date" className="input" value={allocateForm.expectedReturnDate} onChange={(e) => setAllocateForm({ ...allocateForm, expectedReturnDate: e.target.value })} />
            </div>
            <button type="submit" className="btn-primary w-full">Allocate</button>
          </form>
        )}
      </Modal>

      {/* Return modal */}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title={`Return ${returnModal?.asset?.assetTag || ''}`}>
        <form onSubmit={handleReturn} className="space-y-4">
          <div>
            <label className="label">Condition on return</label>
            <select className="input" value={returnForm.conditionOnReturn} onChange={(e) => setReturnForm({ ...returnForm, conditionOnReturn: e.target.value })}>
              <option value="">Keep current condition</option>
              {['New', 'Good', 'Fair', 'Poor', 'Damaged'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Check-in notes</label>
            <textarea maxLength={1000} className="input" rows={3} value={returnForm.returnNotes} onChange={(e) => setReturnForm({ ...returnForm, returnNotes: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full">Confirm return</button>
        </form>
      </Modal>

      {/* Transfer request modal */}
      <Modal open={!!transferModal} onClose={() => setTransferModal(null)} title={`Request Transfer - ${transferModal?.assetLabel || ''}`}>
        <form onSubmit={handleRequestTransfer} className="space-y-4">
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={transferForm.targetType === 'user'} onChange={() => setTransferForm({ ...transferForm, targetType: 'user' })} /> Employee</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" checked={transferForm.targetType === 'department'} onChange={() => setTransferForm({ ...transferForm, targetType: 'department' })} /> Department</label>
          </div>
          {transferForm.targetType === 'user' ? (
            <div>
              <label className="label">Transfer to employee</label>
              <select required className="input" value={transferForm.toUser} onChange={(e) => setTransferForm({ ...transferForm, toUser: e.target.value })}>
                <option value="">Select employee</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label className="label">Transfer to department</label>
              <select required className="input" value={transferForm.toDepartment} onChange={(e) => setTransferForm({ ...transferForm, toDepartment: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Reason</label>
            <textarea maxLength={1000} className="input" rows={2} value={transferForm.reason} onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })} />
          </div>
          <div>
            <label className="label">Expected return date (optional)</label>
            <input type="date" className="input" value={transferForm.expectedReturnDate} onChange={(e) => setTransferForm({ ...transferForm, expectedReturnDate: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full">Submit transfer request</button>
        </form>
      </Modal>
    </AppLayout>
  );
}
