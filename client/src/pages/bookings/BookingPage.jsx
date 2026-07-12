import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import AppLayout from '../../components/layout/AppLayout';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import api from '../../api/axios';

function fmtDateTime(d) {
  return new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resources, setResources] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(searchParams.get('new') === '1');
  const [form, setForm] = useState({ resourceId: '', date: '', startTime: '', endTime: '', purpose: '' });
  const [error, setError] = useState('');

  const loadResources = () => {
    api.get('/assets', { params: { bookableOnly: 'true' } }).then((res) => setResources(res.data));
  };

  const loadBookings = () => {
    setLoading(true);
    const params = {};
    if (selectedResource) params.resource = selectedResource;
    api.get('/bookings', { params }).then((res) => setBookings(res.data)).finally(() => setLoading(false));
  };

  useEffect(loadResources, []);
  useEffect(loadBookings, [selectedResource]);

  const grouped = useMemo(() => {
    const byDay = {};
    bookings
      .filter((b) => b.status !== 'Cancelled')
      .forEach((b) => {
        const day = new Date(b.startTime).toDateString();
        byDay[day] = byDay[day] || [];
        byDay[day].push(b);
      });
    return Object.entries(byDay).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  }, [bookings]);

  const handleBook = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const startTime = new Date(`${form.date}T${form.startTime}`).toISOString();
      const endTime = new Date(`${form.date}T${form.endTime}`).toISOString();
      await api.post('/bookings', { resourceId: form.resourceId, startTime, endTime, purpose: form.purpose });
      setModalOpen(false);
      searchParams.delete('new');
      setSearchParams(searchParams);
      setForm({ resourceId: '', date: '', startTime: '', endTime: '', purpose: '' });
      loadBookings();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create booking');
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm('Cancel this booking?')) return;
    await api.patch(`/bookings/${booking._id}/cancel`);
    loadBookings();
  };

  return (
    <AppLayout title="Resource Booking">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-5">
        <select className="input w-auto max-w-xs" value={selectedResource} onChange={(e) => setSelectedResource(e.target.value)}>
          <option value="">All bookable resources</option>
          {resources.map((r) => <option key={r._id} value={r._id}>{r.assetTag} · {r.name}</option>)}
        </select>
        <button className="btn-primary" onClick={() => setModalOpen(true)}>
          <PlusCircle size={16} /> Book Resource
        </button>
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading bookings...</p>
      ) : grouped.length === 0 ? (
        <div className="card p-10 text-center text-slate-400 text-sm">No bookings yet - book a room, vehicle or equipment above.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <h3 className="text-sm font-semibold text-slate-500 mb-2">{new Date(day).toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</h3>
              <div className="card divide-y divide-slate-100">
                {items.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).map((b) => (
                  <div key={b._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{b.resource?.assetTag} · {b.resource?.name}</p>
                      <p className="text-xs text-slate-500">{fmtDateTime(b.startTime)} - {fmtDateTime(b.endTime)} · {b.bookedBy?.name}</p>
                      {b.purpose && <p className="text-xs text-slate-400">{b.purpose}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={b.status} />
                      {['Upcoming'].includes(b.status) && (
                        <button className="text-red-600 text-sm font-medium hover:underline" onClick={() => handleCancel(b)}>Cancel</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); searchParams.delete('new'); setSearchParams(searchParams); }} title="Book a Resource">
        <form onSubmit={handleBook} className="space-y-4">
          {error && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}
          <div>
            <label className="label">Resource</label>
            <select required className="input" value={form.resourceId} onChange={(e) => setForm({ ...form, resourceId: e.target.value })}>
              <option value="">Select a bookable resource</option>
              {resources.map((r) => <option key={r._id} value={r._id}>{r.assetTag} · {r.name} {r.location ? `(${r.location})` : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Date</label>
            <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start time</label>
              <input type="time" required className="input" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <label className="label">End time</label>
              <input type="time" required className="input" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Purpose (optional)</label>
            <input maxLength={300} className="input" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary w-full">Confirm booking</button>
        </form>
      </Modal>
    </AppLayout>
  );
}
