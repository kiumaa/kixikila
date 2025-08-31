import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';

interface UserStats {
  wallet_balance: number;
  total_saved: number;
  total_earned: number;
  total_withdrawn: number;
  active_groups: number;
  trust_score: number;
  completed_cycles: number;
}

export const useUserData = () => {
  const { user } = useAuthStore();
  const [userStats, setUserStats] = useState<UserStats>({
    wallet_balance: 0,
    total_saved: 0,
    total_earned: 0,
    total_withdrawn: 0,
    active_groups: 0,
    trust_score: 50,
    completed_cycles: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUserStats = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Get user data including financial stats
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          wallet_balance,
          total_saved,
          total_earned,
          total_withdrawn,
          active_groups,
          trust_score,
          completed_cycles
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      if (userData) {
        setUserStats({
          wallet_balance: userData.wallet_balance || 0,
          total_saved: userData.total_saved || 0,
          total_earned: userData.total_earned || 0,
          total_withdrawn: userData.total_withdrawn || 0,
          active_groups: userData.active_groups || 0,
          trust_score: userData.trust_score || 50,
          completed_cycles: userData.completed_cycles || 0
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data';
      setError(errorMessage);
      console.error('Error fetching user stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateWalletBalance = useCallback(async (newBalance: number) => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ wallet_balance: newBalance })
        .eq('id', user.id);

      if (error) throw error;

      setUserStats(prev => ({ ...prev, wallet_balance: newBalance }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update balance';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      throw err;
    }
  }, [user?.id, toast]);

  useEffect(() => {
    fetchUserStats();
  }, [fetchUserStats]);

  return {
    userStats,
    isLoading,
    error,
    refetch: fetchUserStats,
    updateWalletBalance
  };
};

export const useNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      setNotifications(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    isLoading,
    error,
    refetch: fetchNotifications,
    markAsRead
  };
};