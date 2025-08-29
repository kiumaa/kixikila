import { useState, useEffect, useCallback } from 'react';
import { transactionService, Transaction, TransactionFilters, CreateTransactionRequest } from '@/services/transactionService';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type TransactionStatus = Database['public']['Tables']['transactions']['Row']['status'];

export const useTransactions = (filters?: TransactionFilters) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0
  });

  const fetchTransactions = useCallback(async (newFilters?: TransactionFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const finalFilters = { ...filters, ...newFilters };
      const response = await transactionService.getUserTransactions(finalFilters);
      
      setTransactions(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar transações';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (loading || pagination.offset + pagination.limit >= pagination.total) return;

    try {
      setLoading(true);
      const newFilters = {
        ...filters,
        offset: pagination.offset + pagination.limit
      };
      
      const response = await transactionService.getUserTransactions(newFilters);
      
      setTransactions(prev => [...prev, ...response.data]);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar mais transações';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, loading, pagination]);

  const createTransaction = useCallback(async (request: CreateTransactionRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const transaction = await transactionService.createTransaction(request);
      
      // Add to beginning of list
      setTransactions(prev => [transaction, ...prev]);
      
      toast.success('Transação criada com sucesso');
      return transaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTransactionStatus = useCallback(async (
    transactionId: string,
    status: TransactionStatus,
    notes?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedTransaction = await transactionService.updateTransactionStatus(
        transactionId,
        status,
        notes
      );
      
      // Update in list
      setTransactions(prev =>
        prev.map(t => t.id === transactionId ? updatedTransaction : t)
      );
      
      toast.success('Status da transação atualizado');
      return updatedTransaction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshTransactions = useCallback(() => {
    fetchTransactions({ ...filters, offset: 0 });
  }, [fetchTransactions, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    pagination,
    fetchTransactions,
    loadMore,
    createTransaction,
    updateTransactionStatus,
    refreshTransactions
  };
};

export const useTransaction = (transactionId: string) => {
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = useCallback(async () => {
    if (!transactionId) return;

    try {
      setLoading(true);
      setError(null);
      
      const data = await transactionService.getTransaction(transactionId);
      setTransaction(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar transação';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  return {
    transaction,
    loading,
    error,
    refetch: fetchTransaction
  };
};

export const useTransactionStats = () => {
  const [stats, setStats] = useState({
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalEarned: 0,
    totalSpent: 0,
    monthlyStats: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await transactionService.getTransactionStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar estatísticas';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
};