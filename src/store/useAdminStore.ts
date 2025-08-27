import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockGroups, mockTransactions, mockUser, type User, type Group, type Transaction } from '@/data/mockData';

export type AdminRole = 'admin';
export type UserStatus = 'active' | 'banned' | 'inactive';

export interface AdminUser extends User {
  role: AdminRole;
  lastLogin?: string;
  status: UserStatus;
  banReason?: string;
  email: string;
  password: string;
}

export interface PlanConfig {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxGroups: number;
  features: string[];
  isActive: boolean;
}

export interface Promotion {
  id: number;
  name: string;
  discountPercent: number;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  usageCount: number;
}

export interface BrandingConfig {
  logo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  platformName: string;
  platformDescription: string;
  welcomeText: string;
  termsAndConditions: string;
  privacyPolicy: string;
  isDarkMode: boolean;
}

export interface PWAPopupConfig {
  enabled: boolean;
  title: string;
  message: string;
  buttonText: string;
  showAfterSeconds: number;
  dismissible: boolean;
  showOnce: boolean;
  theme: 'auto' | 'light' | 'dark';
  position: 'top' | 'bottom';
  showOnPages: string[];
  icons: {
    light: string;
    dark: string;
  };
}

export interface PWAConfig {
  shortName: string;
  splashScreenImage: string | null;
  icon192: string | null;
  icon512: string | null;
  backgroundColor: string;
  themeColor: string;
  downloadPopup: PWAPopupConfig;
}

export interface SystemConfig {
  stripePublicKey: string;
  stripeSecretKey: string;
  supabaseUrl: string;
  supabaseKey: string;
  bulkSmsApiKey: string;
  domain: string;
}

export interface ActivityLog {
  id: number;
  action: string;
  adminId: number;
  adminName: string;
  targetType: 'user' | 'group' | 'system';
  targetId?: number;
  details: string;
  timestamp: string;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalGroups: number;
  totalRevenue: number;
  freeUsers: number;
  vipUsers: number;
  monthlyGrowth: number;
}

interface AdminState {
  // Auth
  isAdminLoggedIn: boolean;
  currentAdmin: AdminUser | null;
  sessionTimeout: number;
  
  // Users management
  allUsers: AdminUser[];
  
  // Plans & Subscriptions
  planConfigs: PlanConfig[];
  promotions: Promotion[];
  
  // Branding
  brandingConfig: BrandingConfig;
  pwaConfig: PWAConfig;
  
  // System
  systemConfig: SystemConfig;
  
  // Activity logs
  activityLogs: ActivityLog[];
  
  // Statistics
  adminStats: AdminStats;
  
  // Actions - Auth
  adminLogin: (admin: AdminUser) => void;
  adminLogout: () => void;
  extendSession: () => void;
  
  // Actions - Users
  banUser: (userId: number, reason: string) => void;
  unbanUser: (userId: number) => void;
  updateUserPlan: (userId: number, plan: 'free' | 'vip') => void;
  updateUserData: (userId: number, data: Partial<User>) => void;
  
  // Actions - Groups
  deleteGroup: (groupId: number) => void;
  freezeGroup: (groupId: number) => void;
  updateGroup: (groupId: number, data: Partial<Group>) => void;
  
  // Actions - Plans
  updatePlanConfig: (planName: string, config: Partial<PlanConfig>) => void;
  createPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'usageCount'>) => void;
  togglePromotion: (promotionId: number) => void;
  
  // Actions - Branding
  updateBranding: (config: Partial<BrandingConfig>) => void;
  updatePWAConfig: (config: Partial<PWAConfig>) => void;
  
  // Actions - System
  updateSystemConfig: (config: Partial<SystemConfig>) => void;
  
  // Actions - Logs
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  
  // Actions - Stats
  refreshStats: () => void;
}

// Mock admin data
const mockAdminUser: AdminUser = {
  ...mockUser,
  role: 'admin',
  lastLogin: new Date().toISOString(),
  status: 'active',
  email: 'admin@kixikila.com',
  password: 'admin123'
};

const mockUsers: AdminUser[] = [
  mockAdminUser,
  {
    id: 2,
    name: "Pedro Silva",
    phone: "+351 913 456 789",
    avatar: "PS",
    isVIP: false,
    joinDate: "2024-10-15",
    walletBalance: 250.00,
    kycStatus: "verified",
    totalSaved: 850.00,
    totalWithdrawn: 200.00,
    totalEarned: 150.00,
    activeGroups: 1,
    completedCycles: 3,
    trustScore: 85,
    role: 'admin',
    status: 'active',
    lastLogin: "2025-01-20T10:30:00Z",
    email: 'pedro.silva@admin.com',
    password: 'pedro123'
  },
  {
    id: 3,
    name: "Maria Costa",
    phone: "+351 914 567 890",
    avatar: "MC",
    isVIP: true,
    vipExpiry: "2025-06-15",
    joinDate: "2024-12-01",
    walletBalance: 500.00,
    kycStatus: "pending",
    totalSaved: 1200.00,
    totalWithdrawn: 0.00,
    totalEarned: 400.00,
    activeGroups: 2,
    completedCycles: 1,
    trustScore: 92,
    role: 'admin',
    status: 'active',
    email: 'maria.costa@admin.com',
    password: 'maria123'
  }
];

const initialPlanConfigs: PlanConfig[] = [
  {
    name: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxGroups: 2,
    features: ['Até 2 grupos', 'Suporte básico', 'Relatórios básicos'],
    isActive: true
  },
  {
    name: 'vip',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    maxGroups: -1,
    features: ['Grupos ilimitados', 'Suporte prioritário', 'Relatórios avançados', 'Estatísticas detalhadas'],
    isActive: true
  }
];

const initialBrandingConfig: BrandingConfig = {
  logo: null,
  favicon: null,
  primaryColor: 'hsl(239, 84%, 67%)',
  secondaryColor: 'hsl(262, 83%, 58%)',
  platformName: 'KIXIKILA',
  platformDescription: 'A forma mais inteligente de poupar em grupo',
  welcomeText: 'Bem-vindo à plataforma de poupança colaborativa mais segura de Portugal.',
  termsAndConditions: 'Termos e condições padrão...',
  privacyPolicy: 'Política de privacidade padrão...',
  isDarkMode: false
};

const initialPWAConfig: PWAConfig = {
  shortName: 'Kixikila',
  splashScreenImage: null,
  icon192: null,
  icon512: null,
  backgroundColor: '#ffffff',
  themeColor: '#6366f1',
  downloadPopup: {
    enabled: true,
    title: "KIXIKILA: Faça o download da app",
    message: "Instale o app KIXIKILA para uma melhor experiência e acesso offline.",
    buttonText: "Instalar App",
    showAfterSeconds: 5,
    dismissible: true,
    showOnce: false,
    theme: 'auto',
    position: 'top',
    showOnPages: ['/dashboard', '/groups'],
    icons: {
      light: 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso1.png',
      dark: 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso2.png'
    }
  }
};

const mockActivityLogs: ActivityLog[] = [
  {
    id: 1,
    action: 'Utilizador banido',
    adminId: 1,
    adminName: 'Ana Santos',
    targetType: 'user',
    targetId: 2,
    details: 'Utilizador banido por comportamento inadequado',
    timestamp: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    action: 'Grupo eliminado',
    adminId: 1,
    adminName: 'Ana Santos',
    targetType: 'group',
    targetId: 5,
    details: 'Grupo eliminado por violação das regras',
    timestamp: new Date(Date.now() - 7200000).toISOString()
  }
];

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Auth state
      isAdminLoggedIn: false,
      currentAdmin: null,
      sessionTimeout: Date.now() + 10 * 60 * 1000, // 10 minutes
      
      // Data
      allUsers: mockUsers,
      planConfigs: initialPlanConfigs,
      promotions: [],
      brandingConfig: initialBrandingConfig,
      pwaConfig: initialPWAConfig,
      systemConfig: {
        stripePublicKey: '',
        stripeSecretKey: '',
        supabaseUrl: '',
        supabaseKey: '',
        bulkSmsApiKey: '',
        domain: ''
      },
      activityLogs: mockActivityLogs,
      adminStats: {
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(u => u.status === 'active').length,
        bannedUsers: mockUsers.filter(u => u.status === 'banned').length,
        totalGroups: mockGroups.length,
        totalRevenue: 2499.75,
        freeUsers: mockUsers.filter(u => !u.isVIP).length,
        vipUsers: mockUsers.filter(u => u.isVIP).length,
        monthlyGrowth: 12.5
      },
      
      // Auth actions
      adminLogin: (admin: AdminUser) => {
        set({
          isAdminLoggedIn: true,
          currentAdmin: admin,
          sessionTimeout: Date.now() + 10 * 60 * 1000
        });
        get().addActivityLog({
          action: 'Login de administrador',
          adminId: admin.id,
          adminName: admin.name,
          targetType: 'system',
          details: 'Administrador fez login no sistema'
        });
      },
      
      adminLogout: () => {
        const currentAdmin = get().currentAdmin;
        set({
          isAdminLoggedIn: false,
          currentAdmin: null
        });
        if (currentAdmin) {
          get().addActivityLog({
            action: 'Logout de administrador',
            adminId: currentAdmin.id,
            adminName: currentAdmin.name,
            targetType: 'system',
            details: 'Administrador fez logout do sistema'
          });
        }
      },
      
      extendSession: () => {
        set({ sessionTimeout: Date.now() + 10 * 60 * 1000 });
      },
      
      // User actions
      banUser: (userId: number, reason: string) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { ...user, status: 'banned' as UserStatus, banReason: reason }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user && get().currentAdmin) {
          get().addActivityLog({
            action: 'Utilizador banido',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'user',
            targetId: userId,
            details: `Utilizador ${user.name} banido. Razão: ${reason}`
          });
        }
        get().refreshStats();
      },
      
      unbanUser: (userId: number) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { ...user, status: 'active' as UserStatus, banReason: undefined }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user && get().currentAdmin) {
          get().addActivityLog({
            action: 'Utilizador desbaneado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'user',
            targetId: userId,
            details: `Utilizador ${user.name} foi desbaneado`
          });
        }
        get().refreshStats();
      },
      
      updateUserPlan: (userId: number, plan: 'free' | 'vip') => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { 
                  ...user, 
                  isVIP: plan === 'vip',
                  vipExpiry: plan === 'vip' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : undefined
                }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user && get().currentAdmin) {
          get().addActivityLog({
            action: 'Plano alterado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'user',
            targetId: userId,
            details: `Plano do utilizador ${user.name} alterado para ${plan.toUpperCase()}`
          });
        }
        get().refreshStats();
      },
      
      updateUserData: (userId: number, data: Partial<User>) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId ? { ...user, ...data } : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user && get().currentAdmin) {
          get().addActivityLog({
            action: 'Dados do utilizador alterados',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'user',
            targetId: userId,
            details: `Dados do utilizador ${user.name} foram alterados`
          });
        }
      },
      
      // Group actions
      deleteGroup: (groupId: number) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group && get().currentAdmin) {
          get().addActivityLog({
            action: 'Grupo eliminado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'group',
            targetId: groupId,
            details: `Grupo "${group.name}" foi eliminado`
          });
        }
      },
      
      freezeGroup: (groupId: number) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group && get().currentAdmin) {
          get().addActivityLog({
            action: 'Grupo congelado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'group',
            targetId: groupId,
            details: `Grupo "${group.name}" foi congelado`
          });
        }
      },
      
      updateGroup: (groupId: number, data: Partial<Group>) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group && get().currentAdmin) {
          get().addActivityLog({
            action: 'Grupo alterado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'group',
            targetId: groupId,
            details: `Grupo "${group.name}" foi alterado`
          });
        }
      },
      
      // Plan actions
      updatePlanConfig: (planName: string, config: Partial<PlanConfig>) => {
        set((state) => ({
          planConfigs: state.planConfigs.map(plan =>
            plan.name === planName ? { ...plan, ...config } : plan
          )
        }));
        if (get().currentAdmin) {
          get().addActivityLog({
            action: 'Configuração de plano alterada',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: `Configuração do plano ${planName.toUpperCase()} foi alterada`
          });
        }
      },
      
      createPromotion: (promotion: Omit<Promotion, 'id' | 'createdAt' | 'usageCount'>) => {
        const newPromotion: Promotion = {
          ...promotion,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          usageCount: 0
        };
        set((state) => ({
          promotions: [...state.promotions, newPromotion]
        }));
        if (get().currentAdmin) {
          get().addActivityLog({
            action: 'Promoção criada',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: `Promoção "${newPromotion.name}" foi criada com ${newPromotion.discountPercent}% de desconto`
          });
        }
      },
      
      togglePromotion: (promotionId: number) => {
        set((state) => ({
          promotions: state.promotions.map(promo =>
            promo.id === promotionId ? { ...promo, isActive: !promo.isActive } : promo
          )
        }));
        const promotion = get().promotions.find(p => p.id === promotionId);
        if (promotion && get().currentAdmin) {
          get().addActivityLog({
            action: promotion.isActive ? 'Promoção ativada' : 'Promoção desativada',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: `Promoção "${promotion.name}" foi ${promotion.isActive ? 'ativada' : 'desativada'}`
          });
        }
      },
      
      // Branding actions
      updateBranding: (config: Partial<BrandingConfig>) => {
        set((state) => ({
          brandingConfig: { ...state.brandingConfig, ...config }
        }));
        if (get().currentAdmin) {
          get().addActivityLog({
            action: 'Branding alterado',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: 'Configurações de branding foram alteradas'
          });
        }
      },
      
      updatePWAConfig: (config: Partial<PWAConfig>) => {
        set((state) => ({
          pwaConfig: { ...state.pwaConfig, ...config }
        }));
        if (get().currentAdmin) {
          get().addActivityLog({
            action: 'Configuração PWA alterada',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: 'Configurações PWA foram alteradas'
          });
        }
      },
      
      // System actions
      updateSystemConfig: (config: Partial<SystemConfig>) => {
        set((state) => ({
          systemConfig: { ...state.systemConfig, ...config }
        }));
        if (get().currentAdmin) {
          get().addActivityLog({
            action: 'Configuração do sistema alterada',
            adminId: get().currentAdmin!.id,
            adminName: get().currentAdmin!.name,
            targetType: 'system',
            details: 'Configurações do sistema foram alteradas'
          });
        }
      },
      
      // Log actions
      addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
        const newLog: ActivityLog = {
          ...log,
          id: Date.now(),
          timestamp: new Date().toISOString()
        };
        set((state) => ({
          activityLogs: [newLog, ...state.activityLogs].slice(0, 1000) // Keep only last 1000 logs
        }));
      },
      
      // Stats actions
      refreshStats: () => {
        const state = get();
        set({
          adminStats: {
            totalUsers: state.allUsers.length,
            activeUsers: state.allUsers.filter(u => u.status === 'active').length,
            bannedUsers: state.allUsers.filter(u => u.status === 'banned').length,
            totalGroups: mockGroups.length,
            totalRevenue: 2499.75, // Mock calculation
            freeUsers: state.allUsers.filter(u => !u.isVIP).length,
            vipUsers: state.allUsers.filter(u => u.isVIP).length,
            monthlyGrowth: 12.5 // Mock growth rate
          }
        });
      }
    }),
    {
      name: 'kixikila-admin-storage',
      partialize: (state) => ({
        brandingConfig: state.brandingConfig,
        pwaConfig: state.pwaConfig,
        systemConfig: state.systemConfig,
        planConfigs: state.planConfigs,
        promotions: state.promotions
      })
    }
  )
);