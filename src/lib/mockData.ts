// Legacy imports for backward compatibility - redirect to utils
export { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
export type { Group, GroupMember, GroupType, GroupStatus, PayoutMethod, Transaction, TransactionType, TransactionStatus } from '@/lib/utils';

// Temporary mock user for components that still need it during transition
export const mockUser = {
  id: 'temp_user',
  name: 'Utilizador Temporário',
  kycStatus: 'pending' as const,
  joinDate: new Date().toISOString()
};

// Empty arrays for components still using these imports
export const mockGroups: any[] = [];
export const mockNotifications: any[] = [];
export const mockTransactions: any[] = [];