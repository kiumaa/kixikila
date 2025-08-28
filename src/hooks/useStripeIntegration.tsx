import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SubscriptionStatus {
  subscribed: boolean;
  is_vip: boolean;
  plan_type: string | null;
  expiry_date: string | null;
}

export interface PaymentOptions {
  amount: number;
  group_id?: string;
  description: string;
}

export const useStripeIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);

  // Create VIP subscription checkout
  const createVIPCheckout = useCallback(async (planType: 'vip_monthly' | 'vip_yearly' = 'vip_monthly') => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan_type: planType }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        return { success: true, session_id: data.session_id };
      }

      throw new Error('No checkout URL received');

    } catch (error) {
      console.error('Error creating VIP checkout:', error);
      toast.error('Erro ao criar checkout VIP. Tente novamente.');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) throw error;

      const status: SubscriptionStatus = {
        subscribed: data.subscribed || false,
        is_vip: data.is_vip || false,
        plan_type: data.plan_type || null,
        expiry_date: data.expiry_date || null,
      };

      setSubscriptionStatus(status);
      return status;

    } catch (error) {
      console.error('Error checking subscription:', error);
      toast.error('Erro ao verificar subscrição');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Open customer portal for subscription management
  const openCustomerPortal = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      // Open customer portal in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        return { success: true };
      }

      throw new Error('No portal URL received');

    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast.error('Erro ao abrir portal de gestão. Verifique se tem uma subscrição ativa.');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, []);

  // Create one-time payment (for group contributions, etc.)
  const createPayment = useCallback(async (options: PaymentOptions) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          amount: options.amount,
          group_id: options.group_id,
          description: options.description
        }
      });

      if (error) throw error;

      // Open Stripe checkout in new tab
      if (data?.url) {
        window.open(data.url, '_blank');
        return { 
          success: true, 
          session_id: data.session_id,
          transaction_id: data.transaction_id 
        };
      }

      throw new Error('No checkout URL received');

    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Erro ao criar pagamento. Tente novamente.');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    subscriptionStatus,
    createVIPCheckout,
    checkSubscription,
    openCustomerPortal,
    createPayment
  };
};