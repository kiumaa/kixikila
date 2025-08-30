// Mock API Layer - Simulates real backend responses
import { 
  mockUser, 
  mockGroups, 
  mockRecommendedGroups, 
  mockWalletData, 
  mockTransactions,
  mockNotifications,
  mockVIPData,
  mockReferralsData,
  type Group,
  type Transaction,
  type Notification
} from './mockData';
import type { User } from '@/stores/useAuthStore';

// Simulate API delay
const delay = (ms: number = 800) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory storage for mock data persistence
let walletData = { ...mockWalletData };
let userGroups = [...mockGroups];
let userTransactions = [...mockTransactions];
let userNotifications = [...mockNotifications];
let userData = { ...mockUser };

// Auth API
export const authAPI = {
  async sendOTP(phone: string) {
    await delay(1000);
    console.log('Mock OTP sent to:', phone);
    return { success: true };
  },

  async verifyOTP(phone: string, code: string) {
    await delay(1500);
    
    if (code === '123456') {
      return { 
        success: true, 
        user: userData,
        token: 'mock-jwt-token' 
      };
    }
    
    throw new Error('Código inválido');
  },

  async getProfile() {
    await delay(500);
    return userData;
  },

  async updateProfile(updates: Partial<User>) {
    await delay(800);
    userData = { ...userData, ...updates };
    return userData;
  }
};

// Wallet API  
export const walletAPI = {
  async getBalance() {
    await delay(600);
    return walletData;
  },

  async getTransactions(filters?: { type?: string; limit?: number }) {
    await delay(700);
    
    let filtered = [...userTransactions];
    
    if (filters?.type && filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }
    
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    
    return {
      transactions: filtered,
      total: userTransactions.length,
      has_more: filtered.length < userTransactions.length
    };
  },

  async deposit(amount: number) {
    await delay(2000); // Simulate Stripe processing
    
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'deposit',
      amount: amount,
      status: 'completed',
      description: 'Depósito via Stripe',
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      reference: `DEP-${Date.now()}`,
      payment_method: 'stripe'
    };
    
    walletData.balance += amount;
    userTransactions.unshift(transaction);
    
    return transaction;
  },

  async withdraw(amount: number, iban: string) {
    await delay(1000);
    
    if (amount > walletData.balance) {
      throw new Error('Saldo insuficiente');
    }
    
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'withdrawal',
      amount: -amount,
      status: 'pending',
      description: `Levantamento para ${iban.slice(-4)}`,
      created_at: new Date().toISOString(),
      reference: `WTH-${Date.now()}`,
      payment_method: 'bank_transfer'
    };
    
    walletData.balance -= amount;
    walletData.blocked_balance += amount;
    userTransactions.unshift(transaction);
    
    return transaction;
  },

  async payGroupCycle(groupId: string, amount: number) {
    await delay(1200);
    
    if (amount > walletData.balance) {
      throw new Error('Saldo insuficiente');
    }
    
    const group = userGroups.find(g => g.id === groupId);
    if (!group) {
      throw new Error('Grupo não encontrado');
    }
    
    const transaction: Transaction = {
      id: `tx_${Date.now()}`,
      type: 'group_payment',
      amount: -amount,
      status: 'completed',
      description: `Pagamento - ${group.name}`,
      created_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
      group_id: groupId,
      group_name: group.name,
      reference: `PAY-${Date.now()}`
    };
    
    walletData.balance -= amount;
    userTransactions.unshift(transaction);
    
    // Update group member payment status
    const member = group.members.find(m => m.user_id === userData.id);
    if (member) {
      member.paid = true;
    }
    
    return transaction;
  }
};

// Groups API
export const groupsAPI = {
  async getMyGroups() {
    await delay(800);
    return userGroups.filter(group => 
      group.members.some(member => member.user_id === userData.id)
    );
  },

  async getRecommendedGroups() {
    await delay(600);
    return mockRecommendedGroups;
  },

  async getGroupDetails(groupId: string) {
    await delay(500);
    const group = userGroups.find(g => g.id === groupId);
    if (!group) throw new Error('Grupo não encontrado');
    return group;
  },

  async createGroup(groupData: Partial<Group>) {
    await delay(1500);
    
    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      name: groupData.name || '',
      description: groupData.description || '',
      type: groupData.type || 'savings',
      status: 'active',
      payout_method: groupData.payout_method || 'lottery',
      contribution_amount: groupData.contribution_amount || 100,
      contribution_frequency: groupData.contribution_frequency || 'monthly',
      max_members: groupData.max_members || 10,
      current_members: 1,
      current_cycle: 1,
      total_pool: 0,
      creator_id: userData.id,
      created_at: new Date().toISOString(),
      start_date: new Date().toISOString(),
      is_private: groupData.is_private || true,
      requires_approval: groupData.requires_approval || true,
      settings: groupData.settings || {
        payment_window_hours: 72,
        auto_exclude_late_payments: true
      },
      members: [
        {
          user_id: userData.id,
          name: userData.name,
          avatar_url: userData.avatar_url,
          paid: false,
          is_admin: true,
          joined_at: new Date().toISOString()
        }
      ]
    };
    
    userGroups.push(newGroup);
    return newGroup;
  },

  async joinGroup(groupId: string) {
    await delay(1000);
    
    const group = userGroups.find(g => g.id === groupId);
    if (!group) throw new Error('Grupo não encontrado');
    
    if (group.members.some(m => m.user_id === userData.id)) {
      throw new Error('Já é membro deste grupo');
    }
    
    if (group.current_members >= group.max_members) {
      throw new Error('Grupo está cheio');
    }
    
    const newMember = {
      user_id: userData.id,
      name: userData.name,
      avatar_url: userData.avatar_url,
      paid: false,
      joined_at: new Date().toISOString()
    };
    
    group.members.push(newMember);
    group.current_members++;
    
    return group;
  },

  async drawLottery(groupId: string) {
    await delay(2000); // Simulate suspense
    
    const group = userGroups.find(g => g.id === groupId);
    if (!group) throw new Error('Grupo não encontrado');
    
    const eligibleMembers = group.members.filter(m => m.paid && !m.is_winner);
    
    if (eligibleMembers.length === 0) {
      throw new Error('Nenhum membro elegível para o sorteio');
    }
    
    const winner = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
    winner.is_winner = true;
    
    return {
      winner,
      total_amount: group.contribution_amount * group.members.filter(m => m.paid).length,
      confetti: true
    };
  }
};

// Notifications API
export const notificationsAPI = {
  async getNotifications() {
    await delay(500);
    return userNotifications;
  },

  async markAsRead(notificationIds: string[]) {
    await delay(300);
    
    userNotifications = userNotifications.map(notif => 
      notificationIds.includes(notif.id) 
        ? { ...notif, read: true }
        : notif
    );
    
    return { success: true };
  },

  async markAllAsRead() {
    await delay(500);
    
    userNotifications = userNotifications.map(notif => ({
      ...notif,
      read: true
    }));
    
    return { success: true };
  }
};

// VIP API
export const vipAPI = {
  async getVIPStatus() {
    await delay(400);
    return mockVIPData;
  },

  async subscribeVIP(plan: 'monthly' | 'yearly') {
    await delay(2000); // Simulate Stripe subscription
    
    const priceMap = { monthly: 9.99, yearly: 99.99 };
    
    return {
      success: true,
      subscription_id: `sub_${Date.now()}`,
      amount: priceMap[plan],
      next_billing_date: new Date(Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString()
    };
  },

  async cancelVIP() {
    await delay(1000);
    return { success: true };
  }
};

// Notifications API - Export getNotifications function
export const getNotifications = () => {
  return [
    { id: 1, text: "Próximo pagamento em 2 dias", time: "há 1 hora", read: false, type: "payment" },
    { id: 2, text: "Sorteio realizado! Maria João foi contemplada", time: "há 3 horas", read: false, type: "winner" },
    { id: 3, text: "Depósito processado com sucesso", time: "há 1 dia", read: true, type: "deposit" },
    { id: 4, text: "Novo membro no grupo", time: "há 2 dias", read: true, type: "member" }
  ];
};

// Transaction history helper
export const getTransactionHistory = () => {
  return mockTransactions.map(tx => ({
    ...tx,
    date: tx.created_at
  }));
};

// Referrals API
export const referralsAPI = {
  async getReferralData() {
    await delay(600);
    return mockReferralsData;
  },

  async generateReferralLink() {
    await delay(800);
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    return {
      code: `KX-${code}`,
      link: `https://kixikila.pro/convite/${code}`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
  }
};