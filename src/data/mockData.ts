export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isVIP: boolean;
  vipExpiry?: string;
  joinDate: string;
  walletBalance: number;
  kycStatus: 'pending' | 'verified' | 'rejected';
  totalSaved: number;
  totalWithdrawn: number;
  totalEarned: number;
  activeGroups: number;
  completedCycles: number;
  trustScore: number;
}

export interface GroupMember {
  id: number;
  name: string;
  avatar: string;
  paid: boolean;
  isWinner: boolean;
  position?: number;
  isAdmin: boolean;
}

export interface Group {
  id: number;
  name: string;
  description: string;
  contributionAmount: number;
  frequency: 'mensal' | 'quinzenal' | 'semanal';
  maxMembers: number;
  currentMembers: number;
  nextPaymentDate: string;
  status: 'active' | 'ready_for_draw' | 'completed' | 'pending';
  adminId: number;
  cycle: number;
  groupType: 'lottery' | 'order';
  totalPool: number;
  startDate: string;
  privacy: 'public' | 'private' | 'invite_only';
  category: 'family' | 'investment' | 'hobby' | 'emergency' | 'travel';
  members: GroupMember[];
  nextReceiver?: { id: number; name: string; position: number };
  history: {
    cycle: number;
    winner: string;
    amount: number;
    date: string;
  }[];
}

export interface Transaction {
  id: number;
  type: 'deposit' | 'payment' | 'reward' | 'withdrawal';
  amount: number;
  date: string;
  status: 'completed' | 'processing' | 'failed';
  method?: 'stripe' | 'bank_transfer' | 'paypal';
  description: string;
  groupId?: number;
  reference: string;
}

export interface Notification {
  id: number;
  text: string;
  time: string;
  read: boolean;
  type: 'payment' | 'winner' | 'deposit' | 'member' | 'reminder';
}

// Mock Data
export const mockUser: User = {
  id: 1,
  name: "Ana Santos",
  email: "ana.santos@email.pt",
  phone: "+351 912 345 678",
  avatar: "AS",
  isVIP: true,
  vipExpiry: "2025-12-15",
  joinDate: "2024-11-01",
  walletBalance: 1250.50,
  kycStatus: "verified",
  totalSaved: 5420.80,
  totalWithdrawn: 2100.00,
  totalEarned: 3200.00,
  activeGroups: 3,
  completedCycles: 12,
  trustScore: 98
};

export const mockGroups: Group[] = [
  {
    id: 1,
    name: "Família Santos",
    description: "Poupança familiar para férias de verão",
    contributionAmount: 100,
    frequency: "mensal",
    maxMembers: 8,
    currentMembers: 7,
    nextPaymentDate: "2025-09-15",
    status: "active",
    adminId: 1,
    cycle: 3,
    groupType: "lottery",
    totalPool: 700,
    startDate: "2025-06-15",
    privacy: "private",
    category: "family",
    members: [
      { id: 1, name: "Ana Santos", paid: true, avatar: "AS", isWinner: false, position: 1, isAdmin: true },
      { id: 2, name: "Pedro Neto", paid: true, avatar: "PN", isWinner: false, position: 2, isAdmin: false },
      { id: 3, name: "Maria João", paid: true, avatar: "MJ", isWinner: true, position: 3, isAdmin: false },
      { id: 4, name: "João Silva", paid: false, avatar: "JS", isWinner: false, position: 4, isAdmin: false },
      { id: 5, name: "Carlos Lima", paid: true, avatar: "CL", isWinner: false, position: 5, isAdmin: false },
      { id: 6, name: "Rita Costa", paid: true, avatar: "RC", isWinner: false, position: 6, isAdmin: false },
      { id: 7, name: "Paulo Dias", paid: true, avatar: "PD", isWinner: false, position: 7, isAdmin: false }
    ],
    history: [
      { cycle: 1, winner: "Carlos Lima", amount: 800, date: "2025-06-15" },
      { cycle: 2, winner: "Rita Costa", amount: 800, date: "2025-07-15" },
      { cycle: 3, winner: "Maria João", amount: 800, date: "2025-08-15" }
    ]
  },
  {
    id: 2,
    name: "Tech Founders",
    description: "Investimento em startups e projetos tech",
    contributionAmount: 500,
    frequency: "mensal",
    maxMembers: 10,
    currentMembers: 8,
    nextPaymentDate: "2025-09-20",
    status: "ready_for_draw",
    adminId: 2,
    cycle: 1,
    groupType: "order",
    totalPool: 4000,
    startDate: "2025-08-20",
    privacy: "public",
    category: "investment",
    nextReceiver: { id: 8, name: "Luís Ferreira", position: 1 },
    members: [
      { id: 1, name: "Ana Santos", paid: true, avatar: "AS", isWinner: false, position: 3, isAdmin: false },
      { id: 8, name: "Luís Ferreira", paid: true, avatar: "LF", isWinner: false, position: 1, isAdmin: true },
      { id: 9, name: "Sofia Miranda", paid: true, avatar: "SM", isWinner: false, position: 2, isAdmin: false },
      { id: 10, name: "Rui Tavares", paid: true, avatar: "RT", isWinner: false, position: 4, isAdmin: false },
      { id: 11, name: "Miguel Santos", paid: true, avatar: "MS", isWinner: false, position: 5, isAdmin: false },
      { id: 12, name: "Beatriz Costa", paid: true, avatar: "BC", isWinner: false, position: 6, isAdmin: false },
      { id: 13, name: "André Silva", paid: true, avatar: "AS2", isWinner: false, position: 7, isAdmin: false },
      { id: 14, name: "Catarina Lima", paid: true, avatar: "CL2", isWinner: false, position: 8, isAdmin: false }
    ],
    history: []
  },
  {
    id: 3,
    name: "Surf Crew",
    description: "Material e viagens de surf",
    contributionAmount: 75,
    frequency: "mensal",
    maxMembers: 6,
    currentMembers: 5,
    nextPaymentDate: "2025-09-25",
    status: "active",
    adminId: 1,
    cycle: 2,
    groupType: "order",
    totalPool: 375,
    startDate: "2025-07-25",
    privacy: "invite_only",
    category: "hobby",
    nextReceiver: { id: 11, name: "Carla Mendes", position: 2 },
    members: [
      { id: 1, name: "Ana Santos", paid: true, avatar: "AS", isWinner: true, position: 1, isAdmin: true },
      { id: 11, name: "Carla Mendes", paid: false, avatar: "CM", isWinner: false, position: 2, isAdmin: false },
      { id: 12, name: "Bruno Costa", paid: true, avatar: "BC2", isWinner: false, position: 3, isAdmin: false },
      { id: 13, name: "Diana Ramos", paid: true, avatar: "DR", isWinner: false, position: 4, isAdmin: false },
      { id: 14, name: "Eduardo Silva", paid: true, avatar: "ES", isWinner: false, position: 5, isAdmin: false }
    ],
    history: [
      { cycle: 1, winner: "Ana Santos", amount: 450, date: "2025-07-25" }
    ]
  }
];

export const mockTransactions: Transaction[] = [
  { id: 1, type: 'deposit', amount: 500.00, date: '2025-08-20', status: 'completed', method: 'stripe', description: 'Depósito via Stripe', reference: 'DEP-2025-001' },
  { id: 2, type: 'payment', amount: -100.00, date: '2025-08-15', status: 'completed', description: 'Pagamento - Família Santos', groupId: 1, reference: 'PAY-2025-002' },
  { id: 3, type: 'withdrawal', amount: -200.00, date: '2025-08-10', status: 'processing', method: 'bank_transfer', description: 'Levantamento para conta bancária', reference: 'WTH-2025-003' },
  { id: 4, type: 'reward', amount: 800.00, date: '2025-08-05', status: 'completed', description: 'Prémio recebido - Tech Founders', groupId: 2, reference: 'RWD-2025-004' },
  { id: 5, type: 'payment', amount: -500.00, date: '2025-08-01', status: 'completed', description: 'Pagamento - Tech Founders', groupId: 2, reference: 'PAY-2025-005' },
  { id: 6, type: 'payment', amount: -75.00, date: '2025-07-25', status: 'completed', description: 'Pagamento - Surf Crew', groupId: 3, reference: 'PAY-2025-006' },
  { id: 7, type: 'reward', amount: 450.00, date: '2025-07-25', status: 'completed', description: 'Prémio recebido - Surf Crew', groupId: 3, reference: 'RWD-2025-007' }
];

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

export const mockNotifications: Notification[] = [
  { id: 1, text: "Próximo pagamento em 2 dias - Família Santos", time: "há 1 hora", read: false, type: "payment" },
  { id: 2, text: "Sorteio realizado! Maria João foi contemplada", time: "há 3 horas", read: false, type: "winner" },
  { id: 3, text: `Depósito de ${formatCurrency(500)} processado com sucesso`, time: "há 1 dia", read: true, type: "deposit" },
  { id: 4, text: "Novo membro entrou no grupo Tech Founders", time: "há 2 dias", read: true, type: "member" }
];

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