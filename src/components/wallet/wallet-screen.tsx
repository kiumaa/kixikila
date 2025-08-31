'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Wallet, Eye, EyeOff, Upload, Download, ArrowDownLeft, ArrowUpRight, CreditCard, Gift, Filter } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DepositModal } from '@/components/modals/deposit-modal'
import { WithdrawalModal } from '@/components/modals/withdrawal-modal'
import { PaymentCycleModal } from '@/components/modals/payment-cycle-modal'
import { WalletSkeleton } from '@/components/wallet/wallet-skeleton'
import { formatCurrency } from '@/lib/utils'

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
  const [showWithdrawal, setShowWithdrawal] = useState(false)
  const [showPaymentCycle, setShowPaymentCycle] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [userStats, setUserStats] = useState({
    wallet_balance: 1250.50,
    total_saved: 5420.80,
    total_earned: 3200.00,
    total_withdrawn: 2100.00
  })
  const [isLoading, setIsLoading] = useState(true)

  // Mock transactions data
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      type: 'deposit',
      amount: 500.00,
      description: 'Depósito via Stripe',
      status: 'completed',
      created_at: '2025-08-20T10:00:00Z',
      reference: 'DEP-2025-001',
      payment_method: 'stripe'
    },
    {
      id: '2',
      type: 'payment',
      amount: -100.00,
      description: 'Pagamento - Família Santos',
      status: 'completed',
      created_at: '2025-08-15T14:30:00Z',
      reference: 'PAY-2025-002'
    },
    {
      id: '3',
      type: 'withdrawal',
      amount: -200.00,
      description: 'Levantamento para conta bancária',
      status: 'processing',
      created_at: '2025-08-10T09:15:00Z',
      reference: 'WTH-2025-003'
    },
    {
      id: '4',
      type: 'reward',
      amount: 800.00,
      description: 'Prémio recebido - Tech Founders',
      status: 'completed',
      created_at: '2025-08-05T16:45:00Z',
      reference: 'RWD-2025-004'
    },
    {
      id: '5',
      type: 'payment',
      amount: -500.00,
      description: 'Pagamento - Tech Founders',
      status: 'completed',
      created_at: '2025-08-01T12:00:00Z',
      reference: 'PAY-2025-005'
    },
    {
      id: '6',
      type: 'payment',
      amount: -75.00,
      description: 'Pagamento - Surf Crew',
      status: 'completed',
      created_at: '2025-07-25T11:30:00Z',
      reference: 'PAY-2025-006'
    },
    {
      id: '7',
      type: 'reward',
      amount: 450.00,
      description: 'Prémio recebido - Surf Crew',
      status: 'completed',
      created_at: '2025-07-25T10:00:00Z',
      reference: 'RWD-2025-007'
    }
  ]

  useEffect(() => {
    // Mock loading delay
    const timer = setTimeout(() => {
      setTransactions(mockTransactions)
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleDeposit = (amount: number) => {
    // Mock deposit - add to balance and create transaction
    setUserStats(prev => ({
      ...prev,
      wallet_balance: prev.wallet_balance + amount
    }))

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'deposit',
      amount: amount,
      description: 'Depósito via Stripe',
      status: 'completed',
      created_at: new Date().toISOString(),
      reference: `DEP-${Date.now()}`,
      payment_method: 'stripe'
    }

    setTransactions(prev => [newTransaction, ...prev])
  }

  const handleWithdrawal = (amount: number) => {
    // Mock withdrawal - subtract from balance and create transaction
    setUserStats(prev => ({
      ...prev,
      wallet_balance: prev.wallet_balance - amount,
      total_withdrawn: prev.total_withdrawn + amount
    }))

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'withdrawal',
      amount: -amount,
      description: 'Levantamento para conta bancária',
      status: 'processing',
      created_at: new Date().toISOString(),
      reference: `WTH-${Date.now()}`
    }

    setTransactions(prev => [newTransaction, ...prev])
  }

  const handlePaymentCycle = (amount: number, groupName: string) => {
    // Mock payment - subtract from balance and create transaction
    setUserStats(prev => ({
      ...prev,
      wallet_balance: prev.wallet_balance - amount
    }))

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type: 'payment',
      amount: -amount,
      description: `Pagamento - ${groupName}`,
      status: 'completed',
      created_at: new Date().toISOString(),
      reference: `PAY-${Date.now()}`
    }

    setTransactions(prev => [newTransaction, ...prev])
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
    return <WalletSkeleton />
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
                onClick={() => setShowWithdrawal(true)}
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setShowPaymentCycle(true)}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Ciclo
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

      {/* Modals */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        currentBalance={userStats.wallet_balance}
        onDeposit={handleDeposit}
      />
      
      <WithdrawalModal
        isOpen={showWithdrawal}
        onClose={() => setShowWithdrawal(false)}
        currentBalance={userStats.wallet_balance}
        onWithdrawal={handleWithdrawal}
      />
      
      <PaymentCycleModal
        isOpen={showPaymentCycle}
        onClose={() => setShowPaymentCycle(false)}
        groupName="Família Santos"
        contributionAmount={100}
        currentBalance={userStats.wallet_balance}
        onPayment={handlePaymentCycle}
      />
    </div>
  )
}