'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '@/hooks/use-profile'
import { useUserTransactions } from '@/hooks/use-user-transactions'
import { ArrowLeft, Upload, Download, Eye, EyeOff, TrendingUp, History, Filter } from 'lucide-react'
import { MobileButton } from '@/components/ui/mobile-button'
import { MobileCard } from '@/components/ui/mobile-card'
import { AnimatedPage } from '@/components/ui/animated-page'
import { formatCurrency } from '@/lib/utils'

export function MobileWallet() {
  const navigate = useNavigate()
  const { profile, loading: profileLoading } = useProfile()
  const { transactions, loading: transactionsLoading } = useUserTransactions()
  const [balanceVisible, setBalanceVisible] = useState(true)

  const handleBack = () => {
    navigate('/dashboard')
  }

  // Transform Supabase transactions to match expected format
  const transformedTransactions = transactions.map(transaction => ({
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    date: transaction.created_at,
    description: transaction.description,
    status: transaction.status
  }))

  const isLoading = profileLoading || transactionsLoading

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <Download className="w-5 h-5 text-success" />
      case 'payment':
        return <Upload className="w-5 h-5 text-primary" />
      case 'reward':
        return <TrendingUp className="w-5 h-5 text-warning" />
      default:
        return <History className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <AnimatedPage
      title="Carteira Digital"
      onBack={handleBack}
      enableSwipeBack={true}
    >
      {/* Mobile Wallet Balance */}
      <MobileCard variant="glass" className="text-white border-white/20 bg-gradient-to-r from-primary to-primary/90 mb-6">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-primary-foreground/80 text-sm mb-2">Saldo Disponível</div>
              <div className="text-4xl font-bold">
                {balanceVisible ? formatCurrency(profile?.wallet_balance || 0) : '••••••'}
              </div>
            </div>
            <button
              onClick={() => setBalanceVisible(!balanceVisible)}
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors p-2 native-tap"
            >
              {balanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>
          
          {/* Statistics Row */}
          <div className="grid grid-cols-3 gap-4 mb-6 text-center">
            <div>
              <div className="text-primary-foreground/60 text-xs mb-1">Total Poupado</div>
              <div className="font-semibold text-sm">{formatCurrency(profile?.total_saved || 0)}</div>
            </div>
            <div>
              <div className="text-primary-foreground/60 text-xs mb-1">Total Ganho</div>
              <div className="font-semibold text-sm text-success-foreground">+{formatCurrency(profile?.total_earned || 0)}</div>
            </div>
            <div>
              <div className="text-primary-foreground/60 text-xs mb-1">Levantamentos</div>
              <div className="font-semibold text-sm">{formatCurrency(profile?.total_withdrawn || 0)}</div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <MobileButton 
              variant="secondary"
              size="sm"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <Upload className="w-4 h-4" />
              Depositar
            </MobileButton>
            <MobileButton 
              variant="secondary"
              size="sm"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
            >
              <Download className="w-4 h-4" />
              Levantar
            </MobileButton>
          </div>
        </div>
      </MobileCard>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <MobileCard className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-success mx-auto mb-2" />
          <div className="text-sm font-semibold text-success">+24%</div>
          <div className="text-xs text-muted-foreground">Rentabilidade</div>
        </MobileCard>
        <MobileCard className="p-4 text-center">
          <History className="w-6 h-6 text-primary mx-auto mb-2" />
          <div className="text-sm font-semibold text-foreground">{transformedTransactions.length}</div>
          <div className="text-xs text-muted-foreground">Transações</div>
        </MobileCard>
      </div>

      {/* Transactions Section */}
      <MobileCard className="p-0 mb-6">
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-foreground">Transações Recentes</h3>
            <MobileButton variant="ghost" size="sm" fullWidth={false}>
              <Filter className="w-4 h-4" />
            </MobileButton>
          </div>
        </div>
        
        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="p-4 space-y-3">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-muted rounded w-16"></div>
              </div>
            </div>
          ) : transformedTransactions.length > 0 ? (
            transformedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors native-feedback"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">{transaction.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.date).toLocaleDateString('pt-PT')}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold text-sm ${
                  transaction.amount > 0 ? 'text-success' : 'text-foreground'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                </div>
              </div>
            </div>
          ))) : (
            <div className="p-8 text-center">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Ainda não há transações</p>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t border-border/50">
          <MobileButton variant="outline" size="sm">
            Ver Todas as Transações
          </MobileButton>
        </div>
      </MobileCard>

      {/* Empty State for more transactions */}
      <MobileCard className="p-8 text-center">
        <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <h4 className="font-semibold text-foreground mb-2">Histórico Completo</h4>
        <p className="text-muted-foreground text-sm mb-4">
          Aceda ao histórico completo de transações e relatórios detalhados
        </p>
        <MobileButton variant="outline" size="sm">
          Ver Histórico Completo
        </MobileButton>
      </MobileCard>
    </AnimatedPage>
  )
}