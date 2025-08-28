import React, { Suspense, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { 
  mockUser, 
  mockNotifications, 
  type Group
} from '@/data/mockData';

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
  NotificationsScreen,
  CreateGroupModal,
  InviteGroupModal,
  DepositModal,
  WithdrawModal,
  PaymentModal,
  JoinGroupModal
} from '@/routes/LazyRoutes';

const AppPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  
  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/entrar" replace />;
  }
  
  // App state
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInviteGroup, setShowInviteGroup] = useState(false);

  // Global store
  const { canCreateGroup } = useAppStore();

  // Navigation handlers
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  const handleNavigation = (screen: string) => {
    setCurrentScreen(screen);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setCurrentScreen('groupDetails');
  };

  const handleCreateGroup = () => {
    if (!canCreateGroup()) {
      setCurrentScreen('vipManagement');
      return;
    }
    setShowCreateGroup(true);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <DashboardScreen
            onOpenNotifications={() => setCurrentScreen('notifications')}
            onOpenWallet={() => setCurrentScreen('wallet')}
            onOpenDeposit={() => setShowDeposit(true)}
            onOpenWithdraw={() => setShowWithdraw(true)}
            onOpenCreateGroup={handleCreateGroup}
            onOpenJoinGroup={() => setShowJoinGroup(true)}
            onSelectGroup={handleSelectGroup}
            onNavigateToVIP={() => setCurrentScreen('vipManagement')}
            notifications={mockNotifications}
            isLoading={isLoading}
          />
        );

      case 'wallet':
        return (
          <WalletScreen
            onBack={() => setCurrentScreen('dashboard')}
            onOpenDeposit={() => setShowDeposit(true)}
            onOpenWithdraw={() => setShowWithdraw(true)}
          />
        );

      case 'profile':
        return (
          <ProfileScreen
            onBack={() => setCurrentScreen('dashboard')}
            onLogout={handleLogout}
            onOpenPersonalData={() => setCurrentScreen('personalData')}
            onOpenKYC={() => setCurrentScreen('kyc')}
            onOpenPaymentMethods={() => setCurrentScreen('paymentMethods')}
            onOpenNotificationSettings={() => setCurrentScreen('notificationSettings')}
            onOpenSecurity={() => setCurrentScreen('security')}
            onOpenTerms={() => setCurrentScreen('terms')}
            onOpenSupport={() => setCurrentScreen('support')}
            onOpenVIPManagement={() => setCurrentScreen('vipManagement')}
          />
        );

      case 'personalData':
        return (
          <PersonalDataScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'kyc':
        return (
          <KYCScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'notificationSettings':
        return (
          <NotificationSettingsScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'security':
        return (
          <SecurityScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'support':
        return (
          <SupportScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'paymentMethods':
        return (
          <PaymentMethodsScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'terms':
        return (
          <TermsScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        );

      case 'vipManagement':
        return (
          <VIPManagementScreen
            onBack={() => setCurrentScreen('profile')}
          />
        );

      case 'groupDetails':
        return selectedGroup ? (
          <GroupDetailsScreen
            group={selectedGroup}
            currentUserId={mockUser.id}
            onBack={() => setCurrentScreen('dashboard')}
            onPay={() => setShowPayment(true)}
            onInvite={() => setShowInviteGroup(true)}
          />
        ) : null;

      default:
        return <LoadingScreen message="Carregando aplicação..." />;
    }
  };

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  return (
    <ErrorBoundary>
      <div className="max-w-md mx-auto bg-background min-h-screen relative">
        <Suspense fallback={<LoadingScreen />}>
          {renderCurrentScreen()}
        </Suspense>

        {/* Modals */}
        <Suspense fallback={null}>
          {showCreateGroup && (
            <CreateGroupModal
              isOpen={showCreateGroup}
              onClose={() => setShowCreateGroup(false)}
              onNavigateToVIP={() => setCurrentScreen('vipManagement')}
            />
          )}

          {showJoinGroup && (
            <JoinGroupModal
              isOpen={showJoinGroup}
              onClose={() => setShowJoinGroup(false)}
            />
          )}

          {showDeposit && (
            <DepositModal
              isOpen={showDeposit}
              onClose={() => setShowDeposit(false)}
              currentBalance={mockUser.walletBalance}
            />
          )}

          {showWithdraw && (
            <WithdrawModal
              isOpen={showWithdraw}
              onClose={() => setShowWithdraw(false)}
              currentBalance={mockUser.walletBalance}
            />
          )}

          {showInviteGroup && selectedGroup && (
            <InviteGroupModal
              isOpen={showInviteGroup}
              onClose={() => setShowInviteGroup(false)}
              group={selectedGroup}
            />
          )}

          {showPayment && selectedGroup && (
            <PaymentModal
              isOpen={showPayment}
              onClose={() => setShowPayment(false)}
              group={selectedGroup}
              currentBalance={mockUser.walletBalance}
            />
          )}
        </Suspense>

        {/* Bottom Navigation */}
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={handleNavigation}
          onCreateGroup={handleCreateGroup}
          notificationCount={unreadNotifications}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
            <LoadingScreen message="Processando..." />
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default AppPage;