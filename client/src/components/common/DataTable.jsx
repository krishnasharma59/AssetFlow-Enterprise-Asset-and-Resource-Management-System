import React from 'react';

// columns: [{ key, label, render?: (row) => node }]
export default function DataTable({ columns, rows, emptyMessage = 'Nothing here yet', keyField = '_id' }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  if (safeRows.length === 0) {
    return (
      <div className="card p-10 text-center text-slate-400 text-sm">{emptyMessage}</div>
    );
  }

  return (
    <div className="card overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            {columns.map((col) => (
              <th key={col.key} className="text-left font-medium text-slate-500 px-4 py-3 whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeRows.map((row) => (
            <tr key={row[keyField]} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 align-middle whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
