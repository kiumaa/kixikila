import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('pt-PT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Types previously in mockData.ts
export type GroupType = 'savings' | 'investment' | 'loan' | 'emergency' | 'goal_based';
export type GroupStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type PayoutMethod = 'lottery' | 'order';
export type TransactionType = 'deposit' | 'withdrawal' | 'payment' | 'reward' | 'fee' | 'group_payment';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  avatar_url?: string;
  paid: boolean;
  is_admin: boolean;
  isWinner?: boolean;
  joined_at: string;
  position?: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  contribution_amount: number;
  max_members: number;
  current_members: number;
  total_pool: number;
  next_payment_date: string;
  status: GroupStatus;
  group_type: GroupType;
  current_cycle: number;
  is_private: boolean;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members?: GroupMember[];
  frequency?: string;
  requires_approval?: boolean;
  // Legacy properties for compatibility
  adminId?: string;
  groupType?: string;
  totalPool?: number;
  contributionAmount?: number;
  currentMembers?: number;
  maxMembers?: number;
  nextPaymentDate?: string;
  cycle?: number;
  nextReceiver?: any;
  history?: any[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  status: TransactionStatus;
  description: string;
  method?: string;
  group_id?: string;
  reference: string;
  user_id: string;
  created_at: string;
}
