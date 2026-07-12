import React, { useEffect, useState } from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';

const emptyField = { label: '', type: 'text' };

export default function CategoryTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', customFields: [] });
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/categories').then((res) => setCategories(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', customFields: [] });
    setError('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description, customFields: cat.customFields || [] });
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.patch(`/categories/${editing._id}`, form);
      } else {
        await api.post('/categories', form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? This can't be undone.`)) return;
    await api.delete(`/categories/${cat._id}`);
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-slate-500">Categories can carry optional custom fields, e.g. a warranty period for Electronics.</p>
        <button className="btn-primary" onClick={openCreate}>
          <PlusCircle size={16} /> New Category
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'name', label: 'Category' },
            { key: 'description', label: 'Description', render: (r) => r.description || '—' },
            {
              key: 'fields',
              label: 'Custom Fields',
              render: (r) => (r.customFields?.length ? r.customFields.map((f) => f.label).join(', ') : '—'),
            },
            {
              key: 'actions',
              label: '',
              render: (r) => (
                <div className="flex gap-2">
                  <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => openEdit(r)}>Edit</button>
                  <button className="text-red-600 text-sm font-medium hover:underline" onClick={() => handleDelete(r)}>Delete</button>
                </div>
              ),
            },
          ]}
          rows={categories}
          emptyMessage="No asset categories yet - Electronics, Furniture, Vehicles... add your first one."
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'New Category'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Category name</label>
            <input required minLength={2} maxLength={80} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea maxLength={500} className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label mb-0">Custom fields (optional)</label>
              <button
                type="button"
                className="text-brand-600 text-sm font-medium hover:underline"
                onClick={() => setForm({ ...form, customFields: [...form.customFields, { ...emptyField }] })}
              >
                + Add field
              </button>
            </div>
            <div className="space-y-2">
              {form.customFields.map((field, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    className="input"
                    maxLength={80}
                    placeholder="Field label e.g. Warranty Period"
                    value={field.label}
                    onChange={(e) => {
                      const next = [...form.customFields];
                      next[idx].label = e.target.value;
                      setForm({ ...form, customFields: next });
                    }}
                  />
                  <select
                    className="input w-32"
                    value={field.type}
                    onChange={(e) => {
                      const next = [...form.customFields];
                      next[idx].type = e.target.value;
                      setForm({ ...form, customFields: next });
                    }}
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  <button
                    type="button"
                    className="text-red-500 shrink-0"
                    onClick={() => setForm({ ...form, customFields: form.customFields.filter((_, i) => i !== idx) })}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-primary w-full">{editing ? 'Save changes' : 'Create category'}</button>
        </form>
      </Modal>
    </div>
  );
}
