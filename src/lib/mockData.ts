import type { User } from '@/stores/useAuthStore';

// Re-export User type for compatibility
export type { User } from '@/stores/useAuthStore';

// Mock User Data
export const mockUser: User = {
  id: 'user_1',
  phone: '+351934736823',
  full_name: 'Ana Santos',
  name: 'Ana Santos',
  email: 'ana.santos@email.pt',
  avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
  is_vip: true,
  vip_expiry_date: '2025-12-15T00:00:00Z',
  kyc_status: 'approved',
  trust_score: 98,
  created_at: '2024-01-15T00:00:00Z'
};

// Group Types
export type GroupType = 'savings' | 'investment' | 'emergency';
export type GroupStatus = 'draft' | 'active' | 'completed' | 'paused' | 'pending';
export type PayoutMethod = 'order' | 'lottery';

export interface GroupMember {
  id?: string; // For legacy compatibility
  user_id: string;
  name: string;
  avatar?: string; // For legacy compatibility
  avatar_url?: string;
  paid: boolean;
  position?: number;
  is_winner?: boolean;
  isAdmin?: boolean; // For legacy compatibility
  is_admin?: boolean;
  joined_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  status: GroupStatus;
  payout_method: PayoutMethod;
  
  // Snake case (Supabase standard)
  contribution_amount: number;
  contribution_frequency: 'weekly' | 'monthly';
  max_members: number;
  current_members: number;
  current_cycle: number;
  total_pool: number;
  next_payment_date?: string;
  
  // Legacy camelCase (for admin components compatibility)
  contributionAmount?: number;
  maxMembers?: number;
  currentMembers?: number;
  totalPool?: number;
  nextPaymentDate?: string;
  cycle?: number;
  
  // Additional properties for admin/legacy components
  category?: string;
  privacy?: 'private' | 'public' | 'invite_only';
  frequency?: string;
  adminId?: string;
  groupType?: 'lottery' | 'order';
  nextReceiver?: { id: string; name: string; position: number };
  
  creator_id: string;
  created_at: string;
  start_date?: string;
  
  members: GroupMember[];
  is_private: boolean;
  requires_approval: boolean;
  
  // Group history for admin components
  history?: Array<{
    cycle: number;
    winner: string;
    amount: number;
    date: string;
  }>;
  
  settings: {
    payment_window_hours: number;
    late_payment_fee?: number;
    auto_exclude_late_payments: boolean;
  };
}

// Admin User Type (extended from Supabase User with legacy properties)
export interface AdminUser {
  id: string;
  email?: string;
  full_name: string;
  phone?: string;
  role?: string;
  avatar_url?: string;
  kyc_status?: string;
  is_vip?: boolean;
  is_active?: boolean;
  wallet_balance?: number;
  trust_score?: number;
  active_groups?: number;
  completed_cycles?: number;
  created_at?: string;
  updated_at?: string;
  
  // Legacy properties for admin components
  name?: string;
  avatar?: string;
  kycStatus?: string;
  isVIP?: boolean;
  walletBalance?: number;
  activeGroups?: number;
  trustScore?: number;
  completedCycles?: number;
  joinDate?: string;
  lastLogin?: string;
  status?: 'active' | 'banned' | 'inactive';
}

export interface GroupCycle {
  cycle_number: number;
  winner_user_id?: string;
  winner_name?: string;
  total_amount: number;
  participants_count: number;
  completed_date?: string;
  draw_method: PayoutMethod;
}

// Mock Groups Data  
export const mockGroups: Group[] = [
  {
    id: 'grp_1',
    name: 'Família Santos',
    description: 'Poupança familiar para férias de verão',
    type: 'savings',
    status: 'active',
    payout_method: 'lottery',
    
    // Snake case (Supabase standard)
    contribution_amount: 100,
    contribution_frequency: 'monthly',
    max_members: 8,
    current_members: 7,
    current_cycle: 3,
    total_pool: 700,
    next_payment_date: '2025-09-15T00:00:00Z',
    
    // Legacy camelCase properties
    contributionAmount: 100,
    maxMembers: 8,
    currentMembers: 7,
    totalPool: 700,
    nextPaymentDate: '2025-09-15T00:00:00Z',
    cycle: 3,
    
    // Additional admin properties
    category: 'family',
    privacy: 'private',
    frequency: 'mensal',
    adminId: 'user_1',
    groupType: 'lottery',
    
    creator_id: 'user_1',
    created_at: '2025-06-15T00:00:00Z',
    start_date: '2025-06-15T00:00:00Z',
    is_private: true,
    requires_approval: true,
    
    settings: {
      payment_window_hours: 72,
      auto_exclude_late_payments: true
    },
    
    // Group history for admin components
    history: [
      { cycle: 1, winner: 'Carlos Lima', amount: 800, date: '2025-06-15' },
      { cycle: 2, winner: 'Rita Costa', amount: 800, date: '2025-07-15' },
      { cycle: 3, winner: 'Maria João', amount: 800, date: '2025-08-15' }
    ],
    
    members: [
      { 
        id: 'user_1',
        user_id: 'user_1', 
        name: 'Ana Santos', 
        avatar: 'AS',
        avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
        paid: true, 
        is_admin: true,
        isAdmin: true,
        joined_at: '2025-06-15T00:00:00Z' 
      },
      { 
        id: 'user_2',
        user_id: 'user_2', 
        name: 'Pedro Neto', 
        avatar: 'PN',
        paid: true, 
        joined_at: '2025-06-16T00:00:00Z' 
      },
      { 
        id: 'user_3',
        user_id: 'user_3', 
        name: 'Maria João', 
        avatar: 'MJ',
        paid: true, 
        is_winner: true,
        joined_at: '2025-06-17T00:00:00Z' 
      },
      { 
        id: 'user_4',
        user_id: 'user_4', 
        name: 'João Silva', 
        avatar: 'JS',
        paid: false, 
        joined_at: '2025-06-18T00:00:00Z' 
      },
      { 
        id: 'user_5',
        user_id: 'user_5', 
        name: 'Carlos Lima', 
        avatar: 'CL',
        paid: true, 
        joined_at: '2025-06-19T00:00:00Z' 
      },
      { 
        id: 'user_6',
        user_id: 'user_6', 
        name: 'Rita Costa', 
        avatar: 'RC',
        paid: true, 
        joined_at: '2025-06-20T00:00:00Z' 
      },
      { 
        id: 'user_7',
        user_id: 'user_7', 
        name: 'Paulo Dias', 
        avatar: 'PD',
        paid: true, 
        joined_at: '2025-06-21T00:00:00Z' 
      }
    ]
  },
  {
    id: 'grp_2', 
    name: 'Tech Founders',
    description: 'Investimento em startups e projetos tech',
    type: 'investment',
    status: 'active',
    payout_method: 'order',
    
    // Snake case
    contribution_amount: 500,
    contribution_frequency: 'monthly',
    max_members: 10,
    current_members: 8,
    current_cycle: 1,
    total_pool: 4000,
    next_payment_date: '2025-09-20T00:00:00Z',
    
    // Legacy camelCase
    contributionAmount: 500,
    maxMembers: 10,
    currentMembers: 8,
    totalPool: 4000,
    nextPaymentDate: '2025-09-20T00:00:00Z',
    cycle: 1,
    
    // Additional admin properties
    category: 'investment',
    privacy: 'public',
    frequency: 'mensal',
    adminId: 'user_8',
    groupType: 'order',
    nextReceiver: { id: 'user_8', name: 'Luís Ferreira', position: 1 },
    
    creator_id: 'user_8',
    created_at: '2025-08-20T00:00:00Z',
    start_date: '2025-08-20T00:00:00Z',
    is_private: false,
    requires_approval: false,
    
    settings: {
      payment_window_hours: 48,
      auto_exclude_late_payments: false
    },
    
    history: [],
    
    members: [
      { 
        id: 'user_1',
        user_id: 'user_1', 
        name: 'Ana Santos', 
        avatar: 'AS',
        paid: true, 
        position: 3, 
        joined_at: '2025-08-20T00:00:00Z' 
      },
      { 
        id: 'user_8',
        user_id: 'user_8', 
        name: 'Luís Ferreira', 
        avatar: 'LF',
        paid: true, 
        position: 1, 
        is_admin: true,
        isAdmin: true,
        joined_at: '2025-08-20T00:00:00Z' 
      },
      { 
        id: 'user_9',
        user_id: 'user_9', 
        name: 'Sofia Miranda', 
        avatar: 'SM',
        paid: true, 
        position: 2, 
        joined_at: '2025-08-21T00:00:00Z' 
      },
      { 
        id: 'user_10',
        user_id: 'user_10', 
        name: 'Rui Tavares', 
        avatar: 'RT',
        paid: true, 
        position: 4, 
        joined_at: '2025-08-22T00:00:00Z' 
      }
    ]
  }
];

// Mock Admin Users Data
export const mockAdminUsers: AdminUser[] = [
  {
    id: 'user_1',
    email: 'ana.santos@email.pt',
    full_name: 'Ana Santos',
    phone: '+351934736823',
    role: 'user',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face',
    kyc_status: 'approved',
    is_vip: true,
    is_active: true,
    wallet_balance: 1250.50,
    trust_score: 98,
    active_groups: 3,
    completed_cycles: 12,
    created_at: '2024-01-15T00:00:00Z',
    
    // Legacy properties
    name: 'Ana Santos',
    avatar: 'AS',
    kycStatus: 'approved',
    isVIP: true,
    walletBalance: 1250.50,
    activeGroups: 3,
    trustScore: 98,
    completedCycles: 12,
    joinDate: '2024-01-15T00:00:00Z',
    lastLogin: '2025-08-29T10:00:00Z',
    status: 'active'
  },
  {
    id: 'user_2',
    email: 'pedro.neto@email.pt',
    full_name: 'Pedro Neto',
    phone: '+351912345679',
    role: 'user',
    kyc_status: 'pending',
    is_vip: false,
    is_active: true,
    wallet_balance: 450.30,
    trust_score: 85,
    active_groups: 1,
    completed_cycles: 5,
    created_at: '2024-03-20T00:00:00Z',
    
    // Legacy properties
    name: 'Pedro Neto',
    avatar: 'PN',
    kycStatus: 'pending',
    isVIP: false,
    walletBalance: 450.30,
    activeGroups: 1,
    trustScore: 85,
    completedCycles: 5,
    joinDate: '2024-03-20T00:00:00Z',
    status: 'active'
  },
  {
    id: 'user_3',
    email: 'maria.joao@email.pt',
    full_name: 'Maria João',
    phone: '+351912345680',
    role: 'user',
    kyc_status: 'rejected',
    is_vip: false,
    is_active: false,
    wallet_balance: 0,
    trust_score: 30,
    active_groups: 0,
    completed_cycles: 0,
    created_at: '2024-05-10T00:00:00Z',
    
    // Legacy properties
    name: 'Maria João',
    avatar: 'MJ',
    kycStatus: 'rejected',
    isVIP: false,
    walletBalance: 0,
    activeGroups: 0,
    trustScore: 30,
    completedCycles: 0,
    joinDate: '2024-05-10T00:00:00Z',
    status: 'banned'
  }
];

// Mock Recommended Groups
export const mockRecommendedGroups: Group[] = [
  {
    id: 'grp_rec_1',
    name: 'Jovens Profissionais Lisboa',
    description: 'Para jovens profissionais que querem poupar para casa própria',
    type: 'savings',
    status: 'active', 
    payout_method: 'order',
    
    // Snake case
    contribution_amount: 200,
    contribution_frequency: 'monthly',
    max_members: 12,
    current_members: 8,
    current_cycle: 1,
    total_pool: 1600,
    
    // Legacy camelCase
    contributionAmount: 200,
    maxMembers: 12,
    currentMembers: 8,
    totalPool: 1600,
    cycle: 1,
    
    // Additional admin properties
    category: 'savings',
    privacy: 'public',
    frequency: 'mensal',
    
    creator_id: 'user_rec_1',
    created_at: '2025-08-25T00:00:00Z',
    is_private: false,
    requires_approval: true,
    
    settings: {
      payment_window_hours: 72,
      auto_exclude_late_payments: true
    },
    
    history: [],
    members: []
  }
];

// Transaction Types
export type TransactionType = 'deposit' | 'withdrawal' | 'group_payment' | 'group_receipt' | 'fee';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description: string;
  created_at: string;
  processed_at?: string;
  group_id?: string;
  group_name?: string;
  reference?: string;
  payment_method?: 'stripe' | 'bank_transfer' | 'wallet';
}

// Mock Wallet Data
export const mockWalletData = {
  balance: 1250.50,
  blocked_balance: 0,
  total_saved: 5420.80,
  total_withdrawn: 2100.00,
  total_earned: 3200.00
};

// Mock Transactions
export const mockTransactions: Transaction[] = [
  {
    id: 'tx_1',
    type: 'deposit',
    amount: 500.00,
    status: 'completed',
    description: 'Depósito via Stripe',
    created_at: '2025-08-29T18:00:00Z',
    processed_at: '2025-08-29T18:02:00Z',
    reference: 'DEP-2025-001',
    payment_method: 'stripe'
  },
  {
    id: 'tx_2',
    type: 'group_payment',
    amount: -100.00,
    status: 'completed',
    description: 'Pagamento do ciclo',
    created_at: '2025-08-15T00:00:00Z',
    processed_at: '2025-08-15T00:01:00Z',
    group_id: 'grp_1',
    group_name: 'Família Santos',
    reference: 'PAY-2025-002'
  },
  {
    id: 'tx_3',
    type: 'withdrawal',
    amount: -200.00,
    status: 'pending',
    description: 'Levantamento para conta bancária',
    created_at: '2025-08-28T14:30:00Z',
    reference: 'WTH-2025-003',
    payment_method: 'bank_transfer'
  },
  {
    id: 'tx_4',
    type: 'group_receipt',
    amount: 800.00,
    status: 'completed',
    description: 'Prémio recebido',
    created_at: '2025-08-05T20:00:00Z',
    processed_at: '2025-08-05T20:01:00Z',
    group_id: 'grp_1',
    group_name: 'Família Santos',
    reference: 'RWD-2025-004'
  }
];

// Mock Notifications
export interface Notification {
  id: string;
  type: 'payment' | 'winner' | 'invite' | 'vip' | 'reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  action_url?: string;
  metadata?: Record<string, any>;
}

export const mockNotifications: Notification[] = [
  {
    id: 'notif_1',
    type: 'reminder',
    title: 'Pagamento pendente',
    message: 'Tem 2 dias para pagar o grupo "Família Santos"',
    read: false,
    created_at: '2025-08-28T10:00:00Z',
    action_url: '/app/groups/grp_1'
  },
  {
    id: 'notif_2',
    type: 'winner',
    title: 'Parabéns! 🎉',
    message: 'Foi sorteado para receber €800 do grupo "Tech Founders"',
    read: false,
    created_at: '2025-08-25T20:05:00Z',
    action_url: '/app/groups/grp_2'
  },
  {
    id: 'notif_3',
    type: 'payment',
    title: 'Depósito confirmado',
    message: 'Depósito de €500 processado com sucesso',
    read: true,
    created_at: '2025-08-24T15:30:00Z'
  },
  {
    id: 'notif_4',
    type: 'invite',
    title: 'Novo convite',
    message: 'Foi convidado para o grupo "Jovens Empreendedores"',
    read: true,
    created_at: '2025-08-20T12:00:00Z'
  }
];

// Mock VIP Data
export const mockVIPData = {
  is_active: true,
  expires_at: '2025-12-15T00:00:00Z',
  plan: 'monthly',
  price: 9.99,
  benefits: [
    'Grupos ilimitados',
    'Estatísticas avançadas', 
    'Suporte prioritário',
    'Notificações personalizadas',
    'Histórico completo'
  ]
};

// Mock Referrals Data
export const mockReferralsData = {
  referral_code: 'KX-7G5Q',
  total_invites: 5,
  successful_invites: 2,
  pending_invites: 1,
  vip_months_earned: 2,
  invites: [
    {
      id: 'inv_1',
      name: 'Diogo Costa',
      phone: '+351912***678',
      status: 'registered',
      invited_at: '2025-08-15T00:00:00Z',
      registered_at: '2025-08-16T10:30:00Z'
    },
    {
      id: 'inv_2', 
      name: 'Eva Silva',
      phone: '+351913***789',
      status: 'first_payment',
      invited_at: '2025-08-10T00:00:00Z',
      registered_at: '2025-08-11T14:20:00Z',
      first_payment_at: '2025-08-20T16:45:00Z'
    },
    {
      id: 'inv_3',
      name: 'Miguel Santos',
      phone: '+351914***890', 
      status: 'pending',
      invited_at: '2025-08-25T00:00:00Z'
    }
  ]
};

// Utility functions
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