import React from 'react';

export default function KpiCard({ label, value, icon: Icon, tone = 'brand', onClick }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    slate: 'bg-slate-100 text-slate-700',
  };

  return (
    <button
      onClick={onClick}
      className={`card p-4 text-left flex items-center gap-4 ${onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : 'cursor-default'}`}
    >
      {Icon && (
        <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-2xl font-semibold text-slate-900 leading-tight">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </button>
  );
}
