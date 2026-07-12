import React, { useEffect, useState } from 'react';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';

export default function EmployeeTab() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ department: '', status: 'Active', role: 'Employee' });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([api.get('/users'), api.get('/departments')])
      .then(([userRes, deptRes]) => {
        setUsers(userRes.data);
        setDepartments(deptRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openEdit = (u) => {
    setEditing(u);
    setForm({ department: u.department?._id || '', status: u.status, role: u.role });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.patch(`/users/${editing._id}`, { department: form.department || null, status: form.status });
      if (form.role !== editing.role) {
        await api.patch(`/users/${editing._id}/role`, { role: form.role });
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-3">
        <p className="text-sm text-slate-500">
          This is the only place roles get assigned - promote Employees to Department Head or Asset Manager here.
        </p>
        <input
          className="input max-w-xs"
          placeholder="Search name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'department', label: 'Department', render: (r) => r.department?.name || '—' },
            { key: 'role', label: 'Role' },
            { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => openEdit(r)}>
                  Manage
                </button>
              ),
            },
          ]}
          rows={filtered}
          emptyMessage="No employees found."
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Manage ${editing?.name || ''}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Department</label>
            <select className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
              <option value="">Unassigned</option>
              {departments.map((d) => (
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
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} disabled={editing?.role === 'Admin'}>
              <option value="Employee">Employee</option>
              <option value="DepartmentHead">Department Head</option>
              <option value="AssetManager">Asset Manager</option>
            </select>
            {editing?.role === 'Admin' && (
              <p className="text-xs text-slate-400 mt-1">Admin roles can't be changed from this screen.</p>
            )}
          </div>
          <button type="submit" className="btn-primary w-full">Save changes</button>
        </form>
      </Modal>
    </div>
  );
}
