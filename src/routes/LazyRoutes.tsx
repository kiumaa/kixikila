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

export const PersonalDataScreen = lazy(() => 
  import('@/features/profile/PersonalDataScreen').then(module => ({ 
    default: module.PersonalDataScreen 
  }))
);

export const KYCScreen = lazy(() => 
  import('@/features/profile/KYCScreen').then(module => ({ 
    default: module.KYCScreen 
  }))
);

export const NotificationSettingsScreen = lazy(() => 
  import('@/features/profile/NotificationSettingsScreen').then(module => ({ 
    default: module.NotificationSettingsScreen 
  }))
);

export const SecurityScreen = lazy(() => 
  import('@/features/profile/SecurityScreen').then(module => ({ 
    default: module.SecurityScreen 
  }))
);

export const SupportScreen = lazy(() => 
  import('@/features/profile/SupportScreen').then(module => ({ 
    default: module.SupportScreen 
  }))
);

export const PaymentMethodsScreen = lazy(() => 
  import('@/features/profile/PaymentMethodsScreen').then(module => ({ 
    default: module.PaymentMethodsScreen 
  }))
);

export const TermsScreen = lazy(() => 
  import('@/features/profile/TermsScreen').then(module => ({ 
    default: module.TermsScreen 
  }))
);

export const VIPManagementScreen = lazy(() => 
  import('@/features/profile/VIPManagementScreen').then(module => ({ 
    default: module.VIPManagementScreen 
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

export const PaymentSuccessPage = lazy(() => 
  import('@/pages/PaymentSuccessPage').then(module => ({ 
    default: module.PaymentSuccessPage 
  }))
);

export const LoginScreen = lazy(() => 
  import('@/features/auth/LoginScreen').then(module => ({ 
    default: module.LoginScreen 
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

export const InviteGroupModal = lazy(() => 
  import('@/components/modals/InviteGroupModal').then(module => ({ 
    default: module.InviteGroupModal 
  }))
);