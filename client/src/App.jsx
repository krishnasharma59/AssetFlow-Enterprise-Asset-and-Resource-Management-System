import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import OrgSetup from './pages/settings';
import AssetDirectory from './pages/assets/AssetDirectory';
import AssetDetail from './pages/assets/AssetDetail';
import AllocationPage from './pages/allocations/AllocationPage';
import BookingPage from './pages/bookings/BookingPage';
import MaintenancePage from './pages/maintenance/MaintenancePage';
import AuditPage from './pages/audits/AuditPage';
import ReportsPage from './pages/reports/ReportsPage';
import NotificationsPage from './pages/notifications/NotificationsPage';

const secured = (element, roles) => <ProtectedRoute roles={roles}>{element}</ProtectedRoute>;
export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} /><Route path="/signup" element={<Signup />} />
    <Route path="/dashboard" element={secured(<Dashboard />)} />
    <Route path="/org-setup" element={secured(<OrgSetup />, ['Admin'])} />
    <Route path="/assets" element={secured(<AssetDirectory />)} /><Route path="/assets/:id" element={secured(<AssetDetail />)} />
    <Route path="/allocations" element={secured(<AllocationPage />)} /><Route path="/bookings" element={secured(<BookingPage />)} />
    <Route path="/maintenance" element={secured(<MaintenancePage />)} /><Route path="/audits" element={secured(<AuditPage />)} />
    <Route path="/reports" element={secured(<ReportsPage />, ['Admin', 'AssetManager', 'DepartmentHead'])} />
    <Route path="/notifications" element={secured(<NotificationsPage />)} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>;
}
