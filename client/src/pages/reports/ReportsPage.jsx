import React, { useEffect, useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DataTable from '../../components/common/DataTable';
import api from '../../api/axios';

export default function ReportsPage() {
  const [report, setReport] = useState('utilization'); const [data, setData] = useState(null); const [error, setError] = useState('');
  useEffect(() => { setData(null); setError(''); api.get(`/reports/${report}`).then(r=>setData(r.data)).catch(e=>setError(e.response?.data?.message||'Could not load report')); }, [report]);
  const toRows = (value) => Array.isArray(value) ? value : value?.rows || value?.items || value?.data || value?.summary || [];
  const rows = toRows(report === 'utilization' ? data?.mostUsed : report === 'maintenance-frequency' ? data?.byAsset : report === 'lifecycle-outlook' ? data?.nearingRetirement : data);
  const columns = report === 'department-allocation' ? [{key:'department',label:'Department',render:r=>r.department?.name||'Unassigned'},{key:'activeAllocations',label:'Active allocations'},{key:'totalCost',label:'Asset value'}] : report === 'booking-heatmap' ? [{key:'_id',label:'Time',render:r=>`Day ${r._id.dayOfWeek}, ${r._id.hour}:00`},{key:'count',label:'Bookings'}] : [{key:'asset',label:'Asset',render:r=>r.asset?`${r.asset.assetTag} · ${r.asset.name}`:r.name||'-'},{key:'timesAllocated',label:report==='utilization'?'Times allocated':'Requests',render:r=>r.timesAllocated??r.requestCount??'-'},{key:'status',label:'Status',render:r=>r.asset?.status||r.status||'-'}];
  return <AppLayout title="Reports & Analytics"><div className="flex flex-wrap gap-2 mb-6">{['utilization','maintenance-frequency','lifecycle-outlook','department-allocation','booking-heatmap'].map(key=><button key={key} onClick={()=>setReport(key)} className={report===key?'btn-primary':'btn-secondary'}>{key.replaceAll('-',' ')}</button>)}</div>{error?<p className="text-red-600 text-sm">{error}</p>:<DataTable rows={rows||[]} columns={columns} emptyMessage="No report data yet."/>}</AppLayout>;
}
