import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToast } from '@/hooks/use-toast';

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  method: string;
  admin_notes?: string;
  failure_reason?: string;
  metadata: any;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  payout_accounts?: {
    iban: string;
    account_holder_name: string;
    bank_name?: string;
  };
}

export interface CreateWithdrawalRequest {
  amount: number;
  iban: string;
  accountHolderName: string;
  bankName?: string;
}

export const useWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { toast } = useToast();

  const fetchWithdrawals = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          payout_accounts (
            iban,
            account_holder_name,
            bank_name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setWithdrawals(data || []);
    } catch (err: any) {
      console.error('Error fetching withdrawals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createWithdrawal = async (request: CreateWithdrawalRequest): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Utilizador não autenticado",
        variant: "destructive"
      });
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('create-withdrawal', {
        body: {
          amount: request.amount,
          iban: request.iban,
          accountHolderName: request.accountHolderName,
          bankName: request.bankName
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "✅ Levantamento solicitado!",
          description: `${request.amount.toLocaleString('pt-PT', {
            style: 'currency',
            currency: 'EUR'
          })} será processado em 1-2 dias úteis`
        });

        // Refresh withdrawals list
        await fetchWithdrawals();
        return true;
      } else {
        throw new Error(data.error || 'Erro desconhecido');
      }
    } catch (err: any) {
      console.error('Error creating withdrawal:', err);
      setError(err.message);
      
      toast({
        title: "Erro ao criar levantamento",
        description: err.message,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelWithdrawal = async (withdrawalId: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('withdrawals')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) throw error;

      toast({
        title: "Levantamento cancelado",
        description: "O seu pedido de levantamento foi cancelado"
      });

      // Refresh withdrawals list
      await fetchWithdrawals();
      return true;
    } catch (err: any) {
      console.error('Error cancelling withdrawal:', err);
      setError(err.message);
      
      toast({
        title: "Erro ao cancelar",
        description: err.message,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    fetchWithdrawals();

    // Set up real-time subscription
    const channel = supabase
      .channel('withdrawals_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Withdrawal change detected:', payload);
          fetchWithdrawals();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    withdrawals,
    loading,
    error,
    createWithdrawal,
    cancelWithdrawal,
    refetch: fetchWithdrawals
  };
};

export const usePayoutAccounts = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const fetchAccounts = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payout_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAccounts(data || []);
    } catch (err) {
      console.error('Error fetching payout accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [user]);

  return {
    accounts,
    loading,
    refetch: fetchAccounts
  };
};