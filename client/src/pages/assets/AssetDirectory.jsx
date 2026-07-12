import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle, PlusCircle, Search, Trash2 } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];

const emptyForm = {
  name: '', category: '', serialNumber: '', acquisitionDate: '', acquisitionCost: '',
  condition: 'New', location: '', photoUrl: '', isBookable: false, department: '',
};

export default function AssetDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const canRegister = ['Admin', 'AssetManager'].includes(user?.role);

  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '', category: '', status: searchParams.get('status') || '', department: '', location: '',
  });
  const [modalOpen, setModalOpen] = useState(searchParams.get('register') === '1');
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadRefData = () => {
    Promise.all([api.get('/categories'), api.get('/departments')]).then(([catRes, deptRes]) => {
      setCategories(catRes.data);
      setDepartments(deptRes.data);
    });
  };

  const loadAssets = () => {
    setLoading(true);
    const params = {};
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
    api.get('/assets', { params }).then((res) => setAssets(res.data)).finally(() => setLoading(false));
  };

  useEffect(loadRefData, []);
  useEffect(loadAssets, [filters]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/assets', {
        ...form,
        acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : 0,
        department: form.department || null,
      });
      setModalOpen(false);
      setForm(emptyForm);
      searchParams.delete('register');
      setSearchParams(searchParams);
      loadAssets();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not register asset');
    }
  };

  const handleDelete = async () => {
    if (!assetToDelete) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/assets/${assetToDelete._id}`);
      setAssetToDelete(null);
      loadAssets();
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Could not delete this asset');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Asset Registration & Directory">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search tag, serial, QR, name..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            />
          </div>
        </div>
        {canRegister && (
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <PlusCircle size={16} /> Register Asset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <select className="input w-auto" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select className="input w-auto" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="input w-auto" value={filters.department} onChange={(e) => setFilters({ ...filters, department: e.target.value })}>
          <option value="">All departments</option>
          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <input
          className="input w-auto"
          placeholder="Location"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading assets...</p>
      ) : (
        <DataTable
          emptyMessage="No assets match your filters yet."
          columns={[
            { key: 'assetTag', label: 'Tag', render: (r) => <span className="font-medium text-slate-800">{r.assetTag}</span> },
            { key: 'name', label: 'Name' },
            { key: 'category', label: 'Category', render: (r) => r.category?.name || '—' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            { key: 'location', label: 'Location', render: (r) => r.location || '—' },
            {
              key: 'holder', label: 'Held by',
              render: (r) => r.currentHolderUser?.name || r.currentHolderDepartment?.name || '—',
            },
            { key: 'bookable', label: 'Bookable', render: (r) => (r.isBookable ? 'Yes' : 'No') },
            {
              key: 'actions', label: '',
              render: (r) => <div className="flex items-center gap-3">
                <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => navigate(`/assets/${r._id}`)}>View</button>
                {canRegister && <button className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline" onClick={() => { setDeleteError(''); setAssetToDelete(r); }}><Trash2 size={15} /> Delete</button>}
              </div>,
            },
          ]}
          rows={assets}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); searchParams.delete('register'); setSearchParams(searchParams); }}
        title="Register Asset"
        wide
      >
        <form onSubmit={handleRegister} className="grid sm:grid-cols-2 gap-4">
          {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Name</label>
            <input required minLength={2} maxLength={40} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Category</label>
            <select required className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Serial number</label>
            <input inputMode="numeric" pattern="[0-9]*" maxLength={11} className="input" placeholder="Maximum 10000000000" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value.replace(/\D/g, '') })} />
          </div>
          <div>
            <label className="label">Acquisition date</label>
            <input type="date" max={new Date().toISOString().slice(0, 10)} className="input" value={form.acquisitionDate} onChange={(e) => setForm({ ...form, acquisitionDate: e.target.value })} />
          </div>
          <div>
            <label className="label">Acquisition cost (reporting only)</label>
            <input type="number" min="0" max="1000000000" step="0.01" className="input" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} />
          </div>
          <div>
            <label className="label">Condition</label>
            <select className="input" value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
              {['New', 'Good', 'Fair', 'Poor', 'Damaged'].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <input minLength={2} maxLength={120} pattern="[A-Za-z0-9][A-Za-z0-9 ,#()/-]*" title="Use 2–120 characters. Letters, numbers, spaces, commas, #, parentheses, / and - are allowed." placeholder="e.g. Room B2, Floor 3, Warehouse-A" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Owning department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Unassigned</option>
              {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Photo URL (optional)</label>
            <input type="url" maxLength={2048} className="input" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              type="checkbox"
              id="isBookable"
              checked={form.isBookable}
              onChange={(e) => setForm({ ...form, isBookable: e.target.checked })}
            />
            <label htmlFor="isBookable" className="text-sm text-slate-700">Shared / bookable resource</label>
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full">Register asset</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!assetToDelete} onClose={() => !deleting && setAssetToDelete(null)} title="Delete asset">
        <div className="space-y-5">
          <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <AlertTriangle className="shrink-0 text-red-600" size={22} />
            <div>
              <p className="font-semibold text-red-800">Delete {assetToDelete?.assetTag}?</p>
              <p className="mt-1 text-sm text-red-700">This permanently removes <strong>{assetToDelete?.name}</strong>. This cannot be undone.</p>
            </div>
          </div>
          <p className="text-sm text-slate-500">Assets with allocations, bookings, maintenance, or audit history are protected. Retire or dispose of those assets instead.</p>
          {deleteError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{deleteError}</p>}
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" disabled={deleting} onClick={() => setAssetToDelete(null)}>Cancel</button>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60" disabled={deleting} onClick={handleDelete}>
              <Trash2 size={16} /> {deleting ? 'Deleting…' : 'Delete permanently'}
            </button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
