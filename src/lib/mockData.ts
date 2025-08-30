import type { User } from '@/stores/useAuthStore';

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
export type GroupStatus = 'draft' | 'active' | 'completed' | 'paused';
export type PayoutMethod = 'order' | 'lottery';

export interface GroupMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  paid: boolean;
  position?: number;
  is_winner?: boolean;
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
  
  contribution_amount: number;
  contribution_frequency: 'weekly' | 'monthly';
  max_members: number;
  current_members: number;
  
  current_cycle: number;
  total_pool: number;
  
  creator_id: string;
  created_at: string;
  start_date?: string;
  next_payment_date?: string;
  
  members: GroupMember[];
  is_private: boolean;
  requires_approval: boolean;
  
  settings: {
    payment_window_hours: number;
    late_payment_fee?: number;
    auto_exclude_late_payments: boolean;
  };
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
    contribution_amount: 100,
    contribution_frequency: 'monthly',
    max_members: 8,
    current_members: 7,
    current_cycle: 3,
    total_pool: 700,
    creator_id: 'user_1',
    created_at: '2025-06-15T00:00:00Z',
    start_date: '2025-06-15T00:00:00Z',
    next_payment_date: '2025-09-15T00:00:00Z',
    is_private: true,
    requires_approval: true,
    settings: {
      payment_window_hours: 72,
      auto_exclude_late_payments: true
    },
    members: [
      { user_id: 'user_1', name: 'Ana Santos', paid: true, is_admin: true, joined_at: '2025-06-15T00:00:00Z' },
      { user_id: 'user_2', name: 'Pedro Neto', paid: true, joined_at: '2025-06-16T00:00:00Z' },
      { user_id: 'user_3', name: 'Maria João', paid: true, is_winner: true, joined_at: '2025-06-17T00:00:00Z' },
      { user_id: 'user_4', name: 'João Silva', paid: false, joined_at: '2025-06-18T00:00:00Z' },
      { user_id: 'user_5', name: 'Carlos Lima', paid: true, joined_at: '2025-06-19T00:00:00Z' },
      { user_id: 'user_6', name: 'Rita Costa', paid: true, joined_at: '2025-06-20T00:00:00Z' },
      { user_id: 'user_7', name: 'Paulo Dias', paid: true, joined_at: '2025-06-21T00:00:00Z' }
    ]
  },
  {
    id: 'grp_2', 
    name: 'Tech Founders',
    description: 'Investimento em startups e projetos tech',
    type: 'investment',
    status: 'active',
    payout_method: 'order',
    contribution_amount: 500,
    contribution_frequency: 'monthly',
    max_members: 10,
    current_members: 8,
    current_cycle: 1,
    total_pool: 4000,
    creator_id: 'user_8',
    created_at: '2025-08-20T00:00:00Z',
    start_date: '2025-08-20T00:00:00Z',
    next_payment_date: '2025-09-20T00:00:00Z',
    is_private: false,
    requires_approval: false,
    settings: {
      payment_window_hours: 48,
      auto_exclude_late_payments: false
    },
    members: [
      { user_id: 'user_1', name: 'Ana Santos', paid: true, position: 3, joined_at: '2025-08-20T00:00:00Z' },
      { user_id: 'user_8', name: 'Luís Ferreira', paid: true, position: 1, is_admin: true, joined_at: '2025-08-20T00:00:00Z' },
      { user_id: 'user_9', name: 'Sofia Miranda', paid: true, position: 2, joined_at: '2025-08-21T00:00:00Z' },
      { user_id: 'user_10', name: 'Rui Tavares', paid: true, position: 4, joined_at: '2025-08-22T00:00:00Z' }
    ]
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
    contribution_amount: 200,
    contribution_frequency: 'monthly',
    max_members: 12,
    current_members: 8,
    current_cycle: 1,
    total_pool: 1600,
    creator_id: 'user_rec_1',
    created_at: '2025-08-25T00:00:00Z',
    is_private: false,
    requires_approval: true,
    settings: {
      payment_window_hours: 72,
      auto_exclude_late_payments: true
    },
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