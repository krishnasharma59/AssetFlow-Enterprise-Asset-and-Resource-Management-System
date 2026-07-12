import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Boxes,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: 'all' },
  { to: '/org-setup', label: 'Organization Setup', icon: Building2, roles: ['Admin'] },
  { to: '/assets', label: 'Assets', icon: Boxes, roles: 'all' },
  { to: '/allocations', label: 'Allocation & Transfer', icon: ArrowLeftRight, roles: 'all' },
  { to: '/bookings', label: 'Resource Booking', icon: CalendarClock, roles: 'all' },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench, roles: 'all' },
  { to: '/audits', label: 'Asset Audit', icon: ClipboardCheck, roles: 'all' },
  { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['Admin', 'AssetManager', 'DepartmentHead'] },
  { to: '/notifications', label: 'Activity & Notifications', icon: Bell, roles: 'all' },
];

export default function Sidebar() {
  const { user } = useAuth();

  const visible = NAV.filter((item) => item.roles === 'all' || item.roles.includes(user?.role));

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-white border-r border-slate-200 flex flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-slate-100">
        <div className="h-8 w-8 rounded-lg bg-brand-600 flex items-center justify-center">
          <Package size={18} className="text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-lg">AssetFlow</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {visible.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
        AssetFlow &middot; Hackathon Build
      </div>
    </aside>
  );
}
