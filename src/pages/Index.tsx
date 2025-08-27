import React, { useState, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
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
  GroupDetailsScreen,
  NotificationsScreen,
  OnboardingScreen,
  LoginScreen,
  RegisterScreen,
  CreateGroupModal,
  DepositModal,
  WithdrawModal,
  PaymentModal,
  JoinGroupModal
} from '@/routes/LazyRoutes';

const Index = () => {
  // App state
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // Navigation handlers
  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('onboarding');
  };

  const handleNavigation = (screen: string) => {
    if (!isLoggedIn && !['onboarding', 'login', 'register'].includes(screen)) {
      setCurrentScreen('login');
      return;
    }
    setCurrentScreen(screen);
  };

  const handleSelectGroup = (group: Group) => {
    setSelectedGroup(group);
    setCurrentScreen('groupDetails');
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
            onOpenCreateGroup={() => setShowCreateGroup(true)}
            onOpenJoinGroup={() => setShowJoinGroup(true)}
            onSelectGroup={handleSelectGroup}
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
            onOpenPersonalData={() => {/* TODO */}}
            onOpenKYC={() => {/* TODO */}}
            onOpenPaymentMethods={() => {/* TODO */}}
            onOpenNotificationSettings={() => {/* TODO */}}
            onOpenSecurity={() => {/* TODO */}}
            onOpenTerms={() => {/* TODO */}}
            onOpenSupport={() => {/* TODO */}}
          />
        );

      case 'notifications':
        return (
          <NotificationsScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        );

      case 'groupDetails':
        return selectedGroup ? (
          <GroupDetailsScreen
            group={selectedGroup}
            currentUserId={mockUser.id}
            onBack={() => setCurrentScreen('dashboard')}
            onPay={() => setShowPayment(true)}
            onInvite={() => {/* TODO */}}
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
        {isLoggedIn && (
          <BottomNavigation
            currentScreen={currentScreen}
            onNavigate={handleNavigation}
            onCreateGroup={() => setShowCreateGroup(true)}
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