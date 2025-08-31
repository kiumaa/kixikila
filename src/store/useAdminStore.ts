import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockAdminUsers, mockGroups, mockTransactions, mockUser, type User, type Group, type Transaction, type AdminUser } from '@/lib/mockData';

// Use AdminUser from mockData
export type { AdminUser } from '@/lib/mockData';
export type AdminRole = 'admin';
export type UserStatus = 'active' | 'banned' | 'inactive';

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
  
  // Actions - Users
  banUser: (userId: string, reason: string) => void;
  unbanUser: (userId: string) => void;
  updateUserPlan: (userId: string, plan: 'free' | 'vip') => void;
  updateUserData: (userId: string, data: Partial<AdminUser>) => void;
  
  // Actions - Groups
  deleteGroup: (groupId: string) => void;
  freezeGroup: (groupId: string) => void;
  updateGroup: (groupId: string, data: Partial<Group>) => void;
  
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

// Mock admin data - remove duplicate, use mockAdminUsers from mockData

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
      // Data
      allUsers: mockAdminUsers,
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
        totalUsers: mockAdminUsers.length,
        activeUsers: mockAdminUsers.filter(u => u.status === 'active').length,
        bannedUsers: mockAdminUsers.filter(u => u.status === 'banned').length,
        totalGroups: mockGroups.length,
        totalRevenue: 2499.75,
        freeUsers: mockAdminUsers.filter(u => !u.isVIP).length,
        vipUsers: mockAdminUsers.filter(u => u.isVIP).length,
        monthlyGrowth: 12.5
      },
      
      // User actions
      banUser: (userId: string, reason: string) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { ...user, status: 'banned' as UserStatus }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user) {
          get().addActivityLog({
            action: 'Utilizador banido',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'user',
            targetId: 1,
            details: `Utilizador ${user.name || user.full_name} banido. Razão: ${reason}`
          });
        }
        get().refreshStats();
      },
      
      unbanUser: (userId: string) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { ...user, status: 'active' as UserStatus }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user) {
          get().addActivityLog({
            action: 'Utilizador desbaneado',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'user',
            targetId: 1,
            details: `Utilizador ${user.name || user.full_name} foi desbaneado`
          });
        }
        get().refreshStats();
      },
      
      updateUserPlan: (userId: string, plan: 'free' | 'vip') => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId
              ? { 
                  ...user, 
                  isVIP: plan === 'vip',
                  is_vip: plan === 'vip'
                }
              : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user) {
          get().addActivityLog({
            action: 'Plano alterado',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'user',
            targetId: 1,
            details: `Plano do utilizador ${user.name || user.full_name} alterado para ${plan.toUpperCase()}`
          });
        }
        get().refreshStats();
      },
      
      updateUserData: (userId: string, data: Partial<AdminUser>) => {
        set((state) => ({
          allUsers: state.allUsers.map(user =>
            user.id === userId ? { ...user, ...data } : user
          )
        }));
        const user = get().allUsers.find(u => u.id === userId);
        if (user) {
          get().addActivityLog({
            action: 'Dados do utilizador alterados',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'user',
            targetId: 1,
            details: `Dados do utilizador ${user.name || user.full_name} foram alterados`
          });
        }
      },
      
      // Group actions
      deleteGroup: (groupId: string) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group) {
          get().addActivityLog({
            action: 'Grupo eliminado',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'group',
            targetId: 1,
            details: `Grupo "${group.name}" foi eliminado`
          });
        }
      },
      
      freezeGroup: (groupId: string) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group) {
          get().addActivityLog({
            action: 'Grupo congelado',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'group',
            targetId: 1,
            details: `Grupo "${group.name}" foi congelado`
          });
        }
      },
      
      updateGroup: (groupId: string, data: Partial<Group>) => {
        const group = mockGroups.find(g => g.id === groupId);
        if (group) {
          get().addActivityLog({
            action: 'Grupo alterado',
            adminId: 1,
            adminName: 'Admin',
            targetType: 'group',
            targetId: 1,
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
        get().addActivityLog({
          action: 'Configuração de plano alterada',
          adminId: 1, // Default admin ID for now
          adminName: 'Admin',
          targetType: 'system',
          details: `Configuração do plano ${planName.toUpperCase()} foi alterada`
        });
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
        get().addActivityLog({
          action: 'Promoção criada',
          adminId: 1, // Default admin ID for now
          adminName: 'Admin',
          targetType: 'system',
          details: `Promoção "${newPromotion.name}" foi criada com ${newPromotion.discountPercent}% de desconto`
        });
      },
      
      togglePromotion: (promotionId: number) => {
        set((state) => ({
          promotions: state.promotions.map(promo =>
            promo.id === promotionId ? { ...promo, isActive: !promo.isActive } : promo
          )
        }));
        const promotion = get().promotions.find(p => p.id === promotionId);
        if (promotion) {
          get().addActivityLog({
            action: promotion.isActive ? 'Promoção ativada' : 'Promoção desativada',
            adminId: 1, // Default admin ID for now
            adminName: 'Admin',
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
        get().addActivityLog({
          action: 'Branding alterado',
          adminId: 1, // Default admin ID for now
          adminName: 'Admin',
          targetType: 'system',
          details: 'Configurações de branding foram alteradas'
        });
      },
      
      updatePWAConfig: (config: Partial<PWAConfig>) => {
        set((state) => ({
          pwaConfig: { ...state.pwaConfig, ...config }
        }));
        get().addActivityLog({
          action: 'Configuração PWA alterada',
          adminId: 1, // Default admin ID for now
          adminName: 'Admin',
          targetType: 'system',
          details: 'Configurações PWA foram alteradas'
        });
      },
      
      // System actions
      updateSystemConfig: (config: Partial<SystemConfig>) => {
        set((state) => ({
          systemConfig: { ...state.systemConfig, ...config }
        }));
        get().addActivityLog({
          action: 'Configuração do sistema alterada',
          adminId: 1, // Default admin ID for now
          adminName: 'Admin',
          targetType: 'system',
          details: 'Configurações do sistema foram alteradas'
        });
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