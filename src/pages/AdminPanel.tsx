import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import { useAuthStore } from '@/stores/useAuthStore';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminLogin from '@/components/admin/AdminLogin';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';

// Lazy load admin pages - New organized structure
const AdminDashboard = lazy(() => import('@/components/admin/pages/dashboard/AdminDashboard'));

// Gestão
const UsersManagement = lazy(() => import('@/components/admin/pages/gestao/UsersManagement'));
const GroupsManagement = lazy(() => import('@/components/admin/pages/gestao/GroupsManagement'));
const PlansManagement = lazy(() => import('@/components/admin/pages/gestao/PlansManagement'));

// Sistema
const SystemSettings = lazy(() => import('@/components/admin/pages/sistema/SystemSettings'));
const AdvancedSystemSettings = lazy(() => import('@/components/admin/pages/sistema/AdvancedSystemSettings'));
const BrandingManagement = lazy(() => import('@/components/admin/pages/sistema/BrandingManagement'));
const PWAManagement = lazy(() => import('@/components/admin/pages/sistema/PWAManagement'));
const AnalyticsDashboard = lazy(() => import('@/components/admin/pages/sistema/AnalyticsDashboard'));
const RealTimeMonitoring = lazy(() => import('@/components/admin/pages/sistema/RealTimeMonitoring'));
const EdgeFunctionsMonitoring = lazy(() => import('@/components/admin/pages/sistema/EdgeFunctionsMonitoring'));
const SystemHealthDashboard = lazy(() => import('@/components/admin/pages/sistema/SystemHealthDashboard'));
const ProductionDeployment = lazy(() => import('@/components/admin/pages/sistema/ProductionDeployment'));
const ProductionMonitoring = lazy(() => import('@/components/admin/pages/sistema/ProductionMonitoring'));

// Segurança
const SecurityDashboard = lazy(() => import('@/components/admin/pages/seguranca/SecurityDashboard'));
const ActivityLogs = lazy(() => import('@/components/admin/pages/seguranca/ActivityLogs'));
const MonitoringDashboard = lazy(() => import('@/components/admin/pages/seguranca/MonitoringDashboard'));

// Comunicação
const MessageTesting = lazy(() => import('@/components/admin/pages/comunicacao/MessageTesting'));
const NotificationsManagement = lazy(() => import('@/components/admin/pages/comunicacao/NotificationsManagement'));
const MessageTemplates = lazy(() => import('@/components/admin/pages/comunicacao/MessageTemplates'));
const BulkMessaging = lazy(() => import('@/components/admin/pages/comunicacao/BulkMessaging'));

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
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          
          {/* Dashboard */}
          <Route path="dashboard" element={<AdminDashboard />} />
          
          {/* Flattened Routes - New Structure */}
          <Route path="users" element={<UsersManagement />} />
          <Route path="groups" element={<GroupsManagement />} />
          <Route path="plans" element={<PlansManagement />} />
          <Route path="settings" element={<SystemSettings />} />
          <Route path="advanced-settings" element={<AdvancedSystemSettings />} />
          <Route path="branding" element={<BrandingManagement />} />
          <Route path="pwa" element={<PWAManagement />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="real-time-monitoring" element={<RealTimeMonitoring />} />
          <Route path="edge-functions" element={<EdgeFunctionsMonitoring />} />
          <Route path="system-health" element={<SystemHealthDashboard />} />
          <Route path="production-deployment" element={<ProductionDeployment />} />
          <Route path="production-monitoring" element={<ProductionMonitoring />} />
          <Route path="security" element={<SecurityDashboard />} />
          <Route path="logs" element={<ActivityLogs />} />
          <Route path="monitoring" element={<MonitoringDashboard />} />
          <Route path="message-testing" element={<MessageTesting />} />
          <Route path="notifications" element={<NotificationsManagement />} />
          <Route path="templates" element={<MessageTemplates />} />
          <Route path="bulk" element={<BulkMessaging />} />

          {/* Backwards compatibility - redirect old grouped routes */}
          <Route path="gestao/users" element={<Navigate to="/admin/users" replace />} />
          <Route path="gestao/groups" element={<Navigate to="/admin/groups" replace />} />
          <Route path="gestao/plans" element={<Navigate to="/admin/plans" replace />} />
          <Route path="sistema/settings" element={<Navigate to="/admin/settings" replace />} />
          <Route path="sistema/advanced" element={<Navigate to="/admin/advanced-settings" replace />} />
          <Route path="sistema/branding" element={<Navigate to="/admin/branding" replace />} />
          <Route path="sistema/pwa" element={<Navigate to="/admin/pwa" replace />} />
          <Route path="seguranca/security" element={<Navigate to="/admin/security" replace />} />
          <Route path="seguranca/logs" element={<Navigate to="/admin/logs" replace />} />
          <Route path="seguranca/monitoring" element={<Navigate to="/admin/monitoring" replace />} />
          <Route path="comunicacao/notifications" element={<Navigate to="/admin/notifications" replace />} />
          <Route path="comunicacao/templates" element={<Navigate to="/admin/templates" replace />} />
          <Route path="comunicacao/bulk" element={<Navigate to="/admin/bulk" replace />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminPanel;