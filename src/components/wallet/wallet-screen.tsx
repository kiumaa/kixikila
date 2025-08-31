'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Wallet, Eye, EyeOff, Upload, Download, ArrowDownLeft, ArrowUpRight, CreditCard, Gift, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { DepositModal } from '@/components/modals/deposit-modal'

interface Transaction {
  id: string
  type: string
  amount: number
  description: string
  status: string
  created_at: string
  reference: string
  payment_method?: string
}

export default function WalletScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userStats, setUserStats] = useState({
    wallet_balance: 0,
    total_saved: 0,
    total_earned: 0,
    total_withdrawn: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserStats()
      fetchTransactions()
    }
  }, [user])

  const fetchUserStats = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('wallet_balance, total_saved, total_earned, total_withdrawn')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setUserStats(data)
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setTransactions(data || [])
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(Math.abs(amount))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
      case 'withdrawal':
        return <ArrowUpRight className="w-5 h-5 text-red-600" />
      case 'payment':
        return <CreditCard className="w-5 h-5 text-blue-600" />
      case 'reward':
        return <Gift className="w-5 h-5 text-purple-600" />
      default:
        return <CreditCard className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-600 bg-emerald-100'
      case 'pending':
        return 'text-amber-600 bg-amber-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.type === filterType)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Carteira Digital</h1>
        </div>

        {/* Balance Card */}
        <Card className="bg-white/10 backdrop-blur-md border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-white/80 text-sm mb-2">Saldo Disponível</div>
                <div className="text-4xl font-bold">
                  {balanceVisible ? formatCurrency(userStats.wallet_balance) : '••••••'}
                </div>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {balanceVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-white/60 text-xs mb-1">Total Poupado</div>
                <div className="font-semibold">{formatCurrency(userStats.total_saved)}</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs mb-1">Total Ganho</div>
                <div className="font-semibold text-emerald-300">+{formatCurrency(userStats.total_earned)}</div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs mb-1">Levantamentos</div>
                <div className="font-semibold">{formatCurrency(userStats.total_withdrawn)}</div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-white text-primary hover:bg-gray-50"
                onClick={() => setShowDeposit(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Transactions */}
      <div className="px-6 -mt-16">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Transações</h3>
            <button className="text-sm text-primary font-medium">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filterType === filter.key 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* Transactions List */}
          <div className="space-y-3">
            {filteredTransactions.length > 0 ? (
              filteredTransactions.map(transaction => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      transaction.type === 'deposit' ? 'bg-emerald-100' :
                      transaction.type === 'withdrawal' ? 'bg-red-100' :
                      transaction.type === 'payment' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(transaction.created_at)}</p>
                      <p className="text-xs text-muted-foreground">Ref: {transaction.reference}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.amount > 0 ? 'text-emerald-600' : 'text-foreground'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                    <Badge className={`text-xs ${getStatusColor(transaction.status)}`}>
                      {transaction.status === 'completed' ? 'Concluída' : 
                       transaction.status === 'pending' ? 'Pendente' : 'Falhou'}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">
                  {filterType === 'all' ? 'Nenhuma transação encontrada' : `Nenhuma ${filterType} encontrada`}
                </p>
                <Button onClick={() => setShowDeposit(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Primeiro Depósito
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Deposit Modal */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        currentBalance={userStats.wallet_balance}
      />
    </div>
  )
}