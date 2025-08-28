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
  const { isAdminLoggedIn, adminLogin, allUsers } = useAdminStore();
  const { user, isAuthenticated } = useAuthStore();

  // Auto-login for admin users from main app
  useEffect(() => {
    if (isAuthenticated && user && !isAdminLoggedIn) {
      // Check if current user is admin in the admin users list
      const adminUser = allUsers.find(adminUser => 
        adminUser.email === user.email && adminUser.role === 'admin'
      );
      
      if (adminUser) {
        adminLogin(adminUser);
      }
    }
  }, [isAuthenticated, user, isAdminLoggedIn, adminLogin, allUsers]);

  // Debug info - remove this after testing
  console.log('AdminPanel Debug:', {
    isAdminLoggedIn,
    isAuthenticated,
    userEmail: user?.email,
    allUsersCount: allUsers.length
  });

  // Temporary debug display
  const debugInfo = {
    isAdminLoggedIn,
    isAuthenticated,
    userEmail: user?.email || 'No user',
    allUsersCount: allUsers.length,
    currentPath: window.location.pathname
  };

  if (!isAdminLoggedIn) {
    return (
      <div>
        <div style={{ position: 'fixed', top: 0, left: 0, background: 'yellow', padding: '10px', zIndex: 9999, fontSize: '12px' }}>
          <strong>Debug:</strong> {JSON.stringify(debugInfo, null, 2)}
        </div>
        <AdminLogin />
      </div>
    );
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