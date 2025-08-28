import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLogin from '@/components/admin/AdminLogin';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';

// Lazy load admin screens
const AdminDashboard = lazy(() => import('@/components/admin/screens/AdminDashboard'));
const UsersManagement = lazy(() => import('@/components/admin/screens/UsersManagement'));
const GroupsManagement = lazy(() => import('@/components/admin/screens/GroupsManagement'));
const PlansManagement = lazy(() => import('@/components/admin/screens/PlansManagement'));
const BrandingManagement = lazy(() => import('@/components/admin/screens/BrandingManagement'));
const PWAManagement = lazy(() => import('@/components/admin/screens/PWAManagement'));
const AdvancedSystemSettings = lazy(() => import('@/components/admin/screens/AdvancedSystemSettings'));
const SecurityDashboard = lazy(() => import('@/components/admin/screens/SecurityDashboard'));
const ActivityLogs = lazy(() => import('@/components/admin/screens/ActivityLogs'));
const SystemSettings = lazy(() => import('@/components/admin/screens/SystemSettings'));

const AdminPanel: React.FC = () => {
  const { isAdminLoggedIn } = useAdminStore();

  if (!isAdminLoggedIn) {
    return <AdminLogin />;
  }

  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UsersManagement />} />
          <Route path="/groups" element={<GroupsManagement />} />
          <Route path="/plans" element={<PlansManagement />} />
          <Route path="/branding" element={<BrandingManagement />} />
          <Route path="/pwa" element={<PWAManagement />} />
          <Route path="/advanced-settings" element={<AdvancedSystemSettings />} />
          <Route path="/security" element={<SecurityDashboard />} />
          <Route path="/logs" element={<ActivityLogs />} />
          <Route path="/settings" element={<SystemSettings />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminPanel;