import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export default function NotificationsPage() {
  const { user } = useAuth(); const [data, setData] = useState({ notifications: [], unreadCount: 0 }); const [logs, setLogs] = useState([]);
  const load = () => { api.get('/notifications').then((r) => setData(r.data)); if (['Admin','AssetManager','DepartmentHead'].includes(user?.role)) api.get('/activity-logs').then((r) => setLogs(r.data)); };
  useEffect(() => { load(); }, [user?.role]);
  const mark = async (id) => { await api.patch(`/notifications/${id}/read`); load(); };
  return <AppLayout title="Activity & Notifications"><div className="flex justify-between mb-4"><p className="text-sm text-slate-500">{data.unreadCount} unread notification(s)</p><button className="btn-secondary" onClick={async () => { await api.patch('/notifications/read-all'); load(); }}>Mark all read</button></div><div className="space-y-2">{data.notifications.map((n) => <button key={n._id} onClick={() => !n.isRead && mark(n._id)} className={`card w-full text-left p-4 ${n.isRead ? 'opacity-70' : 'border-brand-200 bg-brand-50/30'}`}><p className="font-medium text-slate-800">{n.title}</p><p className="text-sm text-slate-500">{n.message}</p><p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p></button>)}{!data.notifications.length && <p className="text-sm text-slate-400">No notifications yet.</p>}</div>{logs.length > 0 && <section className="mt-8"><h2 className="font-semibold mb-3">Activity log</h2><div className="card divide-y">{logs.map((l) => <div key={l._id} className="p-3 text-sm"><b>{l.user?.name || 'System'}</b> {l.action}<span className="text-slate-400"> · {new Date(l.createdAt).toLocaleString()}</span></div>)}</div></section>}</AppLayout>;
}
