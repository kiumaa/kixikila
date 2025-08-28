import { useState, useEffect, useCallback } from 'react';
import { useStripeIntegration } from './useStripeIntegration';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';

export interface VIPStatus {
  isVIP: boolean;
  planType: string | null;
  expiryDate: string | null;
  loading: boolean;
  canCreateGroup: boolean;
  groupCount: number;
  groupLimit: number;
}

export const useVIPStatus = () => {
  const { user } = useAuthStore();
  const { checkSubscription } = useStripeIntegration();
  const [status, setStatus] = useState<VIPStatus>({
    isVIP: false,
    planType: null,
    expiryDate: null,
    loading: true,
    canCreateGroup: false,
    groupCount: 0,
    groupLimit: 2, // Default free limit
  });

  // Get user's group count
  const fetchGroupCount = useCallback(async () => {
    if (!user) return 0;

    try {
      const { data: userGroups, error } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return userGroups?.length || 0;
    } catch (error) {
      console.error('Error fetching group count:', error);
      return 0;
    }
  }, [user]);

  // Update VIP status
  const updateStatus = useCallback(async () => {
    if (!user) return;

    try {
      setStatus(prev => ({ ...prev, loading: true }));

      // Check subscription status
      const subscriptionStatus = await checkSubscription();
      const groupCount = await fetchGroupCount();

      const isVIP = subscriptionStatus?.is_vip || false;
      const groupLimit = isVIP ? Infinity : 2;
      const canCreateGroup = isVIP || groupCount < groupLimit;

      setStatus({
        isVIP,
        planType: subscriptionStatus?.plan_type || null,
        expiryDate: subscriptionStatus?.expiry_date || null,
        loading: false,
        canCreateGroup,
        groupCount,
        groupLimit: isVIP ? Infinity : 2,
      });

    } catch (error) {
      console.error('Error updating VIP status:', error);
      setStatus(prev => ({ 
        ...prev, 
        loading: false,
        canCreateGroup: prev.groupCount < 2 // Fallback to free limit
      }));
    }
  }, [user, checkSubscription, fetchGroupCount]);

  // Initial load and when user changes
  useEffect(() => {
    if (user) {
      updateStatus();
    } else {
      setStatus({
        isVIP: false,
        planType: null,
        expiryDate: null,
        loading: false,
        canCreateGroup: false,
        groupCount: 0,
        groupLimit: 2,
      });
    }
  }, [user, updateStatus]);

  // Listen for real-time updates to group memberships
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('group-memberships')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh status when group memberships change
          updateStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, updateStatus]);

  // Manual refresh function
  const refreshStatus = useCallback(() => {
    updateStatus();
  }, [updateStatus]);

  // Check if user can create a group with validation message  
  const validateGroupCreation = useCallback(() => {
    if (status.loading) {
      return { canCreate: false, message: 'A verificar permissões...' };
    }

    if (status.isVIP) {
      return { canCreate: true, message: 'Pode criar grupos ilimitados com VIP' };
    }

    if (status.groupCount >= status.groupLimit) {
      return { 
        canCreate: false, 
        message: `Atingiu o limite de ${status.groupLimit} grupos. Faça upgrade para VIP para grupos ilimitados.`
      };
    }

    const remaining = status.groupLimit - status.groupCount;
    return { 
      canCreate: true, 
      message: `Pode criar mais ${remaining} grupo${remaining !== 1 ? 's' : ''} no plano gratuito`
    };
  }, [status]);

  return {
    ...status,
    refreshStatus,
    validateGroupCreation,
  };
};