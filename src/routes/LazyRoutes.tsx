import { lazy } from 'react';

// Lazy load screens for code splitting
export const DashboardScreen = lazy(() => 
  import('@/features/dashboard/DashboardScreen').then(module => ({ 
    default: module.DashboardScreen 
  }))
);

export const WalletScreen = lazy(() => 
  import('@/features/wallet/WalletScreen').then(module => ({ 
    default: module.WalletScreen 
  }))
);

export const ProfileScreen = lazy(() => 
  import('@/features/profile/ProfileScreen').then(module => ({ 
    default: module.ProfileScreen 
  }))
);

export const GroupDetailsScreen = lazy(() => 
  import('@/components/screens/GroupDetailsScreen').then(module => ({ 
    default: module.GroupDetailsScreen 
  }))
);

export const NotificationsScreen = lazy(() => 
  import('@/components/screens/NotificationsScreen').then(module => ({ 
    default: module.NotificationsScreen 
  }))
);

export const OnboardingScreen = lazy(() => 
  import('@/features/onboarding/OnboardingScreen').then(module => ({ 
    default: module.OnboardingScreen 
  }))
);

export const LoginScreen = lazy(() => 
  import('@/features/auth/LoginScreen').then(module => ({ 
    default: module.LoginScreen 
  }))
);

export const RegisterScreen = lazy(() => 
  import('@/components/screens/RegisterScreen').then(module => ({ 
    default: module.RegisterScreen 
  }))
);

// Lazy load modals
export const CreateGroupModal = lazy(() => 
  import('@/components/modals/CreateGroupModal').then(module => ({ 
    default: module.CreateGroupModal 
  }))
);

export const DepositModal = lazy(() => 
  import('@/components/modals/DepositModal').then(module => ({ 
    default: module.DepositModal 
  }))
);

export const WithdrawModal = lazy(() => 
  import('@/components/modals/WithdrawModal').then(module => ({ 
    default: module.WithdrawModal 
  }))
);

export const PaymentModal = lazy(() => 
  import('@/components/modals/PaymentModal').then(module => ({ 
    default: module.PaymentModal 
  }))
);

export const JoinGroupModal = lazy(() => 
  import('@/features/search/JoinGroupModal').then(module => ({ 
    default: module.JoinGroupModal 
  }))
);