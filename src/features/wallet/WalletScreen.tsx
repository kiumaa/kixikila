import React, { useState } from 'react';
import { ArrowLeft, Upload, Download, Eye, EyeOff, ArrowDownLeft, ArrowUpRight, CreditCard, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useTransactions, useTransactionStats } from '@/hooks/useTransactions';
import { useWithdrawals } from '@/hooks/useWithdrawals';
import { useUserData } from '@/hooks/useUserData';
import { useAuthStore } from '@/stores/useAuthStore';
import { formatCurrency, formatDate } from '@/lib/utils';

interface WalletScreenProps {
  onBack: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
}

export const WalletScreen: React.FC<WalletScreenProps> = ({
  onBack,
  onOpenDeposit,
  onOpenWithdraw
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [filterType, setFilterType] = useState('all');
  
  const { user } = useAuthStore();
  const { userStats, isLoading: userStatsLoading } = useUserData();

  // Get transactions with filters - will use real hooks when available
  const transactions: any[] = []; // TODO: Replace with real transactions
  const transactionsLoading = false;
  const transactionsError = null;

  // Use real wallet balance from user data
  const currentBalance = userStats?.wallet_balance || 0;
  const isLoading = userStatsLoading;

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-success" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-destructive" />;
      case 'payment':
        return <CreditCard className="w-5 h-5 text-primary" />;
      case 'reward':
        return <Gift className="w-5 h-5 text-warning" />;
      default:
        return <CreditCard className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-success';
    return 'text-foreground';
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Carteira Digital
          </h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-primary-foreground/10 backdrop-blur-md border-0 text-primary-foreground ios-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-primary-foreground/80 text-sm mb-2 font-system">
                  Saldo Disponível
                </div>
                <div className="text-4xl font-bold font-system">
                  {balanceVisible ? formatCurrency(currentBalance) : '••••••'}
                </div>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors ios-button"
                aria-label={balanceVisible ? "Ocultar saldo" : "Mostrar saldo"}
              >
                {balanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-primary-foreground/60 text-xs mb-1 font-system">
                  Total Poupado
                </div>
                <div className="font-semibold font-system">
                  {isLoading ? '•••' : formatCurrency(userStats?.total_saved || 0)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-primary-foreground/60 text-xs mb-1 font-system">
                  Total Ganho
                </div>
                <div className="font-semibold font-system text-success">
                  {isLoading ? '•••' : `+${formatCurrency(userStats?.total_earned || 0)}`}
                </div>
              </div>
              <div className="text-center">
                <div className="text-primary-foreground/60 text-xs mb-1 font-system">
                  Levantamentos
                </div>
                <div className="font-semibold font-system">
                  {isLoading ? '•••' : formatCurrency(userStats?.total_withdrawn || 0)}
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 ios-button"
                onClick={onOpenDeposit}
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0 ios-button"
                onClick={onOpenWithdraw}
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <div className="px-6 -mt-16">
        <Card className="ios-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold font-system text-foreground">Transações</h3>
              <button className="text-sm text-primary font-medium font-system hover:text-primary-hover transition-colors">
                Exportar PDF
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {[
                { key: 'all', label: 'Todas' },
                { key: 'deposit', label: 'Depósitos' },
                { key: 'payment', label: 'Pagamentos' },
                { key: 'reward', label: 'Prémios' },
                { key: 'withdrawal', label: 'Levantamentos' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium font-system whitespace-nowrap transition-all ${
                    filterType === filter.key 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'bg-muted text-muted-foreground hover:bg-muted-hover'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            
            {/* Transactions List */}
            <div className="space-y-3">
              {transactionsLoading && transactions.length === 0 ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : transactions.length > 0 ? (
                transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 hover:bg-surface rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium font-system text-foreground text-sm">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground font-system">
                          {formatDate(transaction.created_at)} • {transaction.reference}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold font-system ${getTransactionColor(transaction.type, transaction.amount)}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </div>
                      <StatusBadge 
                        status={transaction.status === 'completed' ? 'paid' : 'pending'} 
                        size="xs"
                      >
                        {transaction.status === 'completed' ? 'Concluída' : 
                         transaction.status === 'processing' ? 'Processando' :
                         transaction.status === 'failed' ? 'Falhou' :
                         'Pendente'}
                      </StatusBadge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground font-medium font-system">
                    {transactionsError || 'Nenhuma transação encontrada'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    As suas transações aparecerão aqui
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};