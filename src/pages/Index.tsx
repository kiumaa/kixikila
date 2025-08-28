import React, { useState, Suspense, useEffect } from 'react';
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
  OnboardingScreen,
  LoginScreen,
  RegisterScreen,
  CreateGroupModal,
  InviteGroupModal,
  DepositModal,
  WithdrawModal,
  PaymentModal,
  JoinGroupModal
} from '@/routes/LazyRoutes';

const Index = () => {
  // Auth state
  const { isAuthenticated, user, logout } = useAuthStore();
  
  // App state
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Initialize screen based on authentication status
  useEffect(() => {
    if (isAuthenticated && user) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('onboarding');
    }
  }, [isAuthenticated, user]);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showInviteGroup, setShowInviteGroup] = useState(false);

  // Global store
  const { canCreateGroup, userGroups } = useAppStore();

  // Navigation handlers
  const handleLogin = () => {
    setCurrentScreen('dashboard');
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentScreen('onboarding');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      setCurrentScreen('onboarding');
    }
  };

  const handleNavigation = (screen: string) => {
    if (!isAuthenticated && !['onboarding', 'login', 'register'].includes(screen)) {
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setCurrentScreen('groupDetails');
  };

  const handleCreateGroup = () => {
    if (!canCreateGroup()) {
      // toast will be handled by the modal
      return;
    }
    setShowCreateGroup(true);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'onboarding':
        return (
          <OnboardingScreen
            step={step}
            onNext={() => {
              if (step < 2) {
                setStep(step + 1);
              } else if (step === 2) {
                setStep(3);
              } else {
                setCurrentScreen('register');
              }
            }}
            onSkip={() => setCurrentScreen('login')}
          />
        );

      case 'login':
        return (
          <LoginScreen
            onBack={() => setCurrentScreen('onboarding')}
            onSuccess={handleLogin}
            onRegister={() => setCurrentScreen('register')}
          />
        );

      case 'register':
        return (
          <RegisterScreen
            onBack={() => setCurrentScreen('onboarding')}
            onSuccess={handleLogin}
          />
        );

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
        {isAuthenticated && (
          <BottomNavigation
            currentScreen={currentScreen}
            onNavigate={handleNavigation}
            onCreateGroup={handleCreateGroup}
            notificationCount={unreadNotifications}
          />
        )}

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

export default Index;