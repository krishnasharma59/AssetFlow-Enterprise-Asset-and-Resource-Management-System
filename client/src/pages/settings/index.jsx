import React, { useState } from 'react';
import AppLayout from '../../components/layout/AppLayout';
import DepartmentTab from './DepartmentTab';
import CategoryTab from './CategoryTab';
import EmployeeTab from './EmployeeTab';

const TABS = [
  { key: 'departments', label: 'Departments' },
  { key: 'categories', label: 'Asset Categories' },
  { key: 'employees', label: 'Employee Directory' },
];

export default function OrgSetup() {
  const [tab, setTab] = useState('departments');

  return (
    <AppLayout title="Organization Setup">
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key ? 'border-brand-600 text-brand-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'departments' && <DepartmentTab />}
      {tab === 'categories' && <CategoryTab />}
      {tab === 'employees' && <EmployeeTab />}
    </AppLayout>
  );
}
