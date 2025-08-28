import { useState, useEffect } from 'react';
import { PlanService, type Plan, type Promotion, type PlanAnalytics } from '@/services/planService';
import { useToast } from '@/hooks/use-toast';

export const useAdminPlans = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true);
        const data = await PlanService.getPlans();
        setPlans(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
        toast({
          title: "Erro",
          description: "Não foi possível carregar os planos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();
  }, [toast]);

  return { plans, isLoading, error, refetch: () => setIsLoading(true) };
};

export const usePlanAnalytics = () => {
  const [analytics, setAnalytics] = useState<PlanAnalytics>({
    totalSubscribers: 0,
    freeUsers: 0,
    vipUsers: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0,
    churnRate: 0,
    averageLifetimeValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setIsLoading(true);
        const data = await PlanService.getPlanAnalytics();
        setAnalytics(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plan analytics');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { analytics, isLoading, error, refetch: () => setIsLoading(true) };
};

export const usePromotions = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setIsLoading(true);
        const data = await PlanService.getActivePromotions();
        setPromotions(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch promotions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  const createPromotion = async (promotionData: Omit<Promotion, 'id' | 'created_at' | 'current_uses'>) => {
    try {
      const newPromotion = await PlanService.createPromotion(promotionData);
      setPromotions(prev => [newPromotion, ...prev]);
      
      toast({
        title: "Sucesso",
        description: "Promoção criada com sucesso",
      });
      
      return newPromotion;
    } catch (err) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a promoção",
        variant: "destructive",
      });
      throw err;
    }
  };

  return { promotions, isLoading, error, createPromotion, refetch: () => setIsLoading(true) };
};

export default { useAdminPlans, usePlanAnalytics, usePromotions };