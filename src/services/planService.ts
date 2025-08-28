import { supabase } from "@/integrations/supabase/client";

export type PlanType = 'free' | 'vip';

export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  price_monthly: number;
  price_yearly: number;
  max_groups: number;
  features: string[];
  is_active: boolean;
  stripe_price_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  discount_percent: number;
  discount_amount?: number;
  valid_from: string;
  valid_until: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  applicable_plans: string[];
  created_at: string;
}

export interface PlanAnalytics {
  totalSubscribers: number;
  freeUsers: number;
  vipUsers: number;
  conversionRate: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  churnRate: number;
  averageLifetimeValue: number;
}

export class PlanService {
  // Get all plans
  static async getPlans(): Promise<Plan[]> {
    // For now, return default plans since we don't have a plans table yet
    return [
      {
        id: 'free',
        name: 'Plano Gratuito',
        type: 'free',
        price_monthly: 0,
        price_yearly: 0,
        max_groups: 2,
        features: [
          'Até 2 grupos',
          'Participação em grupos públicos',
          'Notificações básicas',
          'Suporte por email'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'vip',
        name: 'Plano VIP',
        type: 'vip',
        price_monthly: 9.99,
        price_yearly: 99.99,
        max_groups: -1, // Unlimited
        features: [
          'Grupos ilimitados',
          'Criação de grupos privados',
          'Prioridade nos sorteios',
          'Relatórios avançados',
          'Notificações premium',
          'Suporte prioritário',
          'Badge VIP exclusivo'
        ],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  // Get plan analytics
  static async getPlanAnalytics(): Promise<PlanAnalytics> {
    const { data: users, error } = await supabase
      .from('users')
      .select('is_vip, created_at, vip_expiry_date');

    if (error) {
      console.error('Error fetching plan analytics:', error);
      throw error;
    }

    const totalUsers = users?.length || 0;
    const vipUsers = users?.filter(u => u.is_vip).length || 0;
    const freeUsers = totalUsers - vipUsers;
    
    const conversionRate = totalUsers > 0 ? (vipUsers / totalUsers) * 100 : 0;
    
    // Calculate monthly revenue (assuming VIP is €9.99/month)
    const monthlyRevenue = vipUsers * 9.99;
    
    // Estimate yearly revenue based on active VIP users
    const yearlyRevenue = monthlyRevenue * 12;

    return {
      totalSubscribers: totalUsers,
      freeUsers,
      vipUsers,
      conversionRate,
      monthlyRevenue,
      yearlyRevenue,
      churnRate: 5.2, // Mock data - would need transaction history
      averageLifetimeValue: 89.99 // Mock data
    };
  }

  // Create or update promotion
  static async createPromotion(promotion: Omit<Promotion, 'id' | 'created_at' | 'current_uses'>): Promise<Promotion> {
    // For now, return a mock promotion since we don't have promotions table
    const newPromotion: Promotion = {
      id: Math.random().toString(36).substring(7),
      current_uses: 0,
      created_at: new Date().toISOString(),
      ...promotion
    };

    return newPromotion;
  }

  // Get active promotions
  static async getActivePromotions(): Promise<Promotion[]> {
    // Mock promotions for now
    return [
      {
        id: 'welcome2024',
        code: 'WELCOME2024',
        name: 'Promoção de Boas-vindas',
        discount_percent: 50,
        valid_from: '2024-01-01T00:00:00Z',
        valid_until: '2024-12-31T23:59:59Z',
        max_uses: 1000,
        current_uses: 234,
        is_active: true,
        applicable_plans: ['vip'],
        created_at: '2024-01-01T00:00:00Z'
      },
      {
        id: 'summer2024',
        code: 'SUMMER50',
        name: 'Promoção de Verão',
        discount_percent: 30,
        valid_from: '2024-06-01T00:00:00Z',
        valid_until: '2024-09-30T23:59:59Z',
        max_uses: 500,
        current_uses: 67,
        is_active: true,
        applicable_plans: ['vip'],
        created_at: '2024-06-01T00:00:00Z'
      }
    ];
  }

  // Update user plan
  static async updateUserPlan(userId: string, planType: PlanType, expiryDate?: string) {
    const updates: any = {
      is_vip: planType === 'vip',
      updated_at: new Date().toISOString()
    };

    if (planType === 'vip' && expiryDate) {
      updates.vip_expiry_date = expiryDate;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user plan:', error);
      throw error;
    }

    // Log the change
    await supabase.from('audit_logs').insert({
      action: 'plan_updated',
      entity_type: 'user',
      entity_id: userId,
      new_values: { plan: planType, expiry: expiryDate }
    });

    return data;
  }

  // Apply promotion code
  static async applyPromotion(userId: string, promoCode: string): Promise<{ success: boolean; discount: number; message: string }> {
    // Mock implementation for now
    const promotions = await this.getActivePromotions();
    const promotion = promotions.find(p => p.code === promoCode && p.is_active);

    if (!promotion) {
      return {
        success: false,
        discount: 0,
        message: 'Código promocional inválido ou expirado'
      };
    }

    if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) {
      return {
        success: false,
        discount: 0,
        message: 'Código promocional esgotado'
      };
    }

    const now = new Date();
    const validFrom = new Date(promotion.valid_from);
    const validUntil = new Date(promotion.valid_until);

    if (now < validFrom || now > validUntil) {
      return {
        success: false,
        discount: 0,
        message: 'Código promocional expirado'
      };
    }

    return {
      success: true,
      discount: promotion.discount_percent,
      message: `Desconto de ${promotion.discount_percent}% aplicado!`
    };
  }
}