import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
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
  const { isAuthenticated, user } = useAuthStore();
  
  // Verificar se o usuário atual é admin
  const isAdminUser = isAuthenticated && user && user.role === 'admin';

  useEffect(() => {
    // Se o usuário estiver autenticado mas não for admin, redirecionar
    if (isAuthenticated && user && user.role !== 'admin') {
      window.location.href = '/';
    }
  }, [isAuthenticated, user]);

  if (!isAdminUser) {
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