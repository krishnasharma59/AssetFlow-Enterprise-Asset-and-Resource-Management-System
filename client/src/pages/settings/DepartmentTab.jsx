import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';

export default function DepartmentTab() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', head: '', parentDepartment: '', status: 'Active' });
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/departments'), api.get('/users')])
      .then(([deptRes, userRes]) => {
        setDepartments(deptRes.data);
        setEmployees(userRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', head: '', parentDepartment: '', status: 'Active' });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name,
      head: dept.head?._id || '',
      parentDepartment: dept.parentDepartment?._id || '',
      status: dept.status,
    });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        name: form.name,
        head: form.head || null,
        parentDepartment: form.parentDepartment || null,
        status: form.status,
      };
      if (editing) {
        await api.patch(`/departments/${editing._id}`, payload);
      } else {
        await api.post('/departments', payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDeactivate = async (dept) => {
    await api.patch(`/departments/${dept._id}/deactivate`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">Departments feed every allocation, booking and audit scope in the system.</p>
        <button className="btn-primary" onClick={openCreate}>
          <PlusCircle size={16} /> New Department
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Department' },
            { key: 'head', label: 'Department Head', render: (r) => r.head?.name || '—' },
            { key: 'parent', label: 'Parent Department', render: (r) => r.parentDepartment?.name || '—' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => openEdit(r)}>
                    Edit
                  </button>
                  {r.status === 'Active' && (
                    <button className="text-red-600 text-sm font-medium hover:underline" onClick={() => handleDeactivate(r)}>
                      Deactivate
                    </button>
                  )}
                </div>
              ),
            },
          ]}
          rows={departments}
          emptyMessage="No departments yet - create the first one."
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Department' : 'New Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Department name</label>
            <input required minLength={2} maxLength={80} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Department Head (optional)</label>
            <select className="input" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })}>
              <option value="">Unassigned</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{e.name} ({e.role})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Parent Department (optional)</label>
            <select className="input" value={form.parentDepartment} onChange={(e) => setForm({ ...form, parentDepartment: e.target.value })}>
              <option value="">None (top-level)</option>
              {departments.filter((d) => d._id !== editing?._id).map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn-primary w-full">{editing ? 'Save changes' : 'Create department'}</button>
        </form>
      </Modal>
    </div>
  );
}
