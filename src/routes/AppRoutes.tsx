import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { mockNotifications, mockGroups, mockUser } from '@/data/mockData';

// Lazy imports
import {
  DashboardScreen,
  WalletScreen,
  ProfileScreen,
  PersonalDataScreen,
  KYCScreen,
  NotificationSettingsScreen,
  SecurityScreen,
  SupportScreen,
  PaymentMethodsScreen,
  TermsScreen,
  VIPManagementScreen,
  GroupDetailsScreen,
  NotificationsScreen
} from '@/routes/LazyRoutes';

// Route wrapper components to handle navigation
const DashboardWrapper = () => {
  const navigate = useNavigate();
  return (
    <DashboardScreen
      onOpenNotifications={() => navigate('/app/notifications')}
      onOpenWallet={() => navigate('/app/wallet')}
      onOpenDeposit={() => {/* TODO: Open deposit modal */}}
      onOpenWithdraw={() => {/* TODO: Open withdraw modal */}}
      onOpenCreateGroup={() => {/* TODO: Handle create group */}}
      onOpenJoinGroup={() => {/* TODO: Handle join group */}}
      onSelectGroup={(group) => navigate(`/app/group/${group.id}`)}
      onNavigateToVIP={() => navigate('/app/vip-management')}
      notifications={mockNotifications}
      isLoading={false}
    />
  );
};

const WalletWrapper = () => {
  const navigate = useNavigate();
  return (
    <WalletScreen
      onBack={() => navigate('/app/dashboard')}
      onOpenDeposit={() => {/* TODO: Open deposit modal */}}
      onOpenWithdraw={() => {/* TODO: Open withdraw modal */}}
    />
  );
};

const NotificationsWrapper = () => {
  const navigate = useNavigate();
  return (
    <NotificationsScreen
      onBack={() => navigate('/app/dashboard')}
    />
  );
};

const ProfileWrapper = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };
  
  return (
    <ProfileScreen
      onBack={() => navigate('/app/dashboard')}
      onLogout={handleLogout}
      onOpenPersonalData={() => navigate('/app/profile/personal-data')}
      onOpenKYC={() => navigate('/app/profile/kyc')}
      onOpenPaymentMethods={() => navigate('/app/profile/payment-methods')}
      onOpenNotificationSettings={() => navigate('/app/profile/notification-settings')}
      onOpenSecurity={() => navigate('/app/profile/security')}
      onOpenTerms={() => navigate('/app/profile/terms')}
      onOpenSupport={() => navigate('/app/profile/support')}
      onOpenVIPManagement={() => navigate('/app/vip-management')}
    />
  );
};

const PersonalDataWrapper = () => {
  const navigate = useNavigate();
  return <PersonalDataScreen onBack={() => navigate('/app/profile')} />;
};

const KYCWrapper = () => {
  const navigate = useNavigate();
  return <KYCScreen onBack={() => navigate('/app/profile')} />;
};

const NotificationSettingsWrapper = () => {
  const navigate = useNavigate();
  return <NotificationSettingsScreen onBack={() => navigate('/app/profile')} />;
};

const SecurityWrapper = () => {
  const navigate = useNavigate();
  return <SecurityScreen onBack={() => navigate('/app/profile')} />;
};

const SupportWrapper = () => {
  const navigate = useNavigate();
  return <SupportScreen onBack={() => navigate('/app/profile')} />;
};

const PaymentMethodsWrapper = () => {
  const navigate = useNavigate();
  return <PaymentMethodsScreen onBack={() => navigate('/app/profile')} />;
};

const TermsWrapper = () => {
  const navigate = useNavigate();
  return <TermsScreen onBack={() => navigate('/app/profile')} />;
};

const VIPManagementWrapper = () => {
  const navigate = useNavigate();
  return <VIPManagementScreen onBack={() => navigate('/app/profile')} />;
};

const GroupDetailsWrapper = () => {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const group = mockGroups.find(g => g.id.toString() === groupId);
  
  if (!group) {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  return (
    <GroupDetailsScreen
      group={group}
      currentUserId={mockUser.id}
      onBack={() => navigate('/app/dashboard')}
      onPay={() => {/* TODO: Open payment modal */}}
      onInvite={() => {/* TODO: Open invite modal */}}
    />
  );
};

const AppRoutes: React.FC = () => {
  const { canCreateGroup } = useAppStore();
  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const handleCreateGroup = () => {
    // This will be handled by the create group route
    window.location.href = canCreateGroup() ? '/app/create-group' : '/app/vip-management';
  };

  return (
    <>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {/* Default redirect to dashboard */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          
          {/* Main app screens */}
          <Route path="dashboard" element={<DashboardWrapper />} />
          <Route path="wallet" element={<WalletWrapper />} />
          <Route path="notifications" element={<NotificationsWrapper />} />
          <Route path="profile" element={<ProfileWrapper />} />
          
          {/* Profile sub-screens */}
          <Route path="profile/personal-data" element={<PersonalDataWrapper />} />
          <Route path="profile/kyc" element={<KYCWrapper />} />
          <Route path="profile/notification-settings" element={<NotificationSettingsWrapper />} />
          <Route path="profile/security" element={<SecurityWrapper />} />
          <Route path="profile/support" element={<SupportWrapper />} />
          <Route path="profile/payment-methods" element={<PaymentMethodsWrapper />} />
          <Route path="profile/terms" element={<TermsWrapper />} />
          
          {/* VIP Management - accessible from both profile and dashboard */}
          <Route path="vip-management" element={<VIPManagementWrapper />} />
          
          {/* Group details */}
          <Route path="group/:groupId" element={<GroupDetailsWrapper />} />
          
          {/* Fallback to dashboard */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Suspense>

      {/* Bottom Navigation */}
      <BottomNavigation
        notificationCount={unreadNotifications}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
};

export default AppRoutes;