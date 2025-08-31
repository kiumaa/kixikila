// Legacy imports for backward compatibility - redirect to utils
export { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
export type { Group, GroupMember, GroupType, GroupStatus, PayoutMethod, Transaction, TransactionType, TransactionStatus } from '@/lib/utils';

// Empty exports for backward compatibility
export const mockRecommendedGroups: any[] = [];
export const mockWalletData = null;
export const mockVIPData = null;
export const mockReferralsData = null;
export const mockGroups: any[] = [];
export const mockNotifications: any[] = [];
export const mockTransactions: any[] = [];

// Temporary mock user for components that still need it during transition
export const mockUser = {
  id: 'temp_user',
  name: 'Utilizador Temporário',
  email: 'user@kixikila.pt', 
  phone: '+351 000 000 000',
  kycStatus: 'pending' as any,
  joinDate: new Date().toISOString(),
  avatar: 'UT',
  walletBalance: 0,
  avatar_url: null
};

// Notification type for backward compatibility
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}