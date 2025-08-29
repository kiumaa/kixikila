import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Use the actual Supabase types
type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

export interface Transaction extends TransactionRow {}

export interface CreateTransactionRequest {
  type: TransactionInsert['type'];
  amount: number;
  description: string;
  group_id?: string;
  payment_method?: TransactionInsert['payment_method'];
  payment_reference?: string;
  metadata?: Record<string, any>;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  group_id?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionResponse {
  data: Transaction[];
  pagination?: {
    total: number;
    limit: number;
    offset: number;
  };
}

class TransactionService {
  /**
   * Get user transactions with optional filters
   */
  async getUserTransactions(filters?: TransactionFilters): Promise<TransactionResponse> {
    try {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type && ['deposit', 'withdrawal', 'contribution', 'reward', 'transfer'].includes(filters.type)) {
        query = query.eq('type', filters.type as TransactionInsert['type']);
      }
      
      if (filters?.status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(filters.status)) {
        query = query.eq('status', filters.status as TransactionRow['status']);
      }
      
      if (filters?.group_id) {
        query = query.eq('group_id', filters.group_id);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching transactions:', error);
        throw new Error('Failed to fetch transactions');
      }

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      };
    } catch (error) {
      console.error('Transaction service error:', error);
      throw error;
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (error) {
        console.error('Error fetching transaction:', error);
        throw new Error('Failed to fetch transaction');
      }

      if (!data) {
        throw new Error('Transaction not found');
      }

      return data;
    } catch (error) {
      console.error('Transaction service error:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<Transaction> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...request,
          user_id: user.id,
          status: 'pending',
          payment_method: request.payment_method || 'stripe'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        throw new Error('Failed to create transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction service error:', error);
      throw error;
    }
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    transactionId: string, 
    status: TransactionRow['status'],
    notes?: string
  ): Promise<Transaction> {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .update({
          status,
          notes,
          processed_at: status === 'completed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', transactionId)
        .select()
        .single();

      if (error) {
        console.error('Error updating transaction:', error);
        throw new Error('Failed to update transaction');
      }

      return data;
    } catch (error) {
      console.error('Transaction service error:', error);
      throw error;
    }
  }

  /**
   * Get group transactions
   */
  async getGroupTransactions(
    groupId: string, 
    filters?: Omit<TransactionFilters, 'group_id'>
  ): Promise<TransactionResponse> {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          users (full_name, avatar_url)
        `, { count: 'exact' })
        .eq('group_id', groupId)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.type && ['deposit', 'withdrawal', 'contribution', 'reward', 'transfer'].includes(filters.type)) {
        query = query.eq('type', filters.type as TransactionInsert['type']);
      }
      
      if (filters?.status && ['pending', 'processing', 'completed', 'failed', 'cancelled'].includes(filters.status)) {
        query = query.eq('status', filters.status as TransactionRow['status']);
      }
      
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply pagination
      const limit = filters?.limit || 50;
      const offset = filters?.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching group transactions:', error);
        throw new Error('Failed to fetch group transactions');
      }

      return {
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset
        }
      };
    } catch (error) {
      console.error('Transaction service error:', error);
      throw error;
    }
  }

  /**
   * Get transaction statistics for dashboard
   */
  async getTransactionStats(): Promise<{
    totalDeposits: number;
    totalWithdrawals: number;
    totalEarned: number;
    totalSpent: number;
    monthlyStats: Array<{
      month: string;
      deposits: number;
      withdrawals: number;
      earnings: number;
    }>;
  }> {
    try {
      // Get current user transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('status', 'completed');

      if (!transactions) {
        throw new Error('Failed to fetch transaction statistics');
      }

      // Calculate totals
      const totalDeposits = transactions
        .filter(t => t.type === 'deposit')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalWithdrawals = transactions
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalEarned = transactions
        .filter(t => t.type === 'reward')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpent = transactions
        .filter(t => t.type === 'contribution')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calculate monthly stats (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const recentTransactions = transactions.filter(
        t => new Date(t.created_at) >= sixMonthsAgo
      );

      const monthlyStats = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const month = date.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
        
        const monthTransactions = recentTransactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return (
            transactionDate.getMonth() === date.getMonth() &&
            transactionDate.getFullYear() === date.getFullYear()
          );
        });

        return {
          month,
          deposits: monthTransactions
            .filter(t => t.type === 'deposit')
            .reduce((sum, t) => sum + t.amount, 0),
          withdrawals: monthTransactions
            .filter(t => t.type === 'withdrawal')
            .reduce((sum, t) => sum + t.amount, 0),
          earnings: monthTransactions
            .filter(t => t.type === 'reward')
            .reduce((sum, t) => sum + t.amount, 0)
        };
      }).reverse();

      return {
        totalDeposits,
        totalWithdrawals,
        totalEarned,
        totalSpent,
        monthlyStats
      };
    } catch (error) {
      console.error('Error getting transaction stats:', error);
      throw error;
    }
  }
}

export const transactionService = new TransactionService();