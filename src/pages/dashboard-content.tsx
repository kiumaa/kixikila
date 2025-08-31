'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wallet, Users, TrendingUp, Crown, Bell, Eye, EyeOff, Upload, Download, History, Calendar, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { DepositModal } from '@/components/modals/deposit-modal'
import { VIPUpgradeModal } from '@/components/modals/vip-upgrade-modal'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Group {
  id: string
  name: string
  description: string
  contribution_amount: number
  max_members: number
  current_members: number
  group_type: string
  status: string
  total_pool: number
  next_payout_date: string
}

export function DashboardPage() {
  const { user } = useAuth()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showVIPUpgrade, setShowVIPUpgrade] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [userStats, setUserStats] = useState({
    wallet_balance: 1250.50,
    total_saved: 5420.80,
    total_earned: 3200.00,
    active_groups: 3,
    trust_score: 98,
    is_vip: user?.is_vip || false
  })
  const [isLoading, setIsLoading] = useState(false)

  // Mock data for demonstration
  const mockGroups: Group[] = [
    {
      id: '1',
      name: 'Família Santos',
      description: 'Poupança familiar para férias de verão',
      contribution_amount: 100,
      max_members: 8,
      current_members: 7,
      group_type: 'lottery',
      status: 'active',
      total_pool: 700,
      next_payout_date: '2025-09-15'
    },
    {
      id: '2',
      name: 'Tech Founders',
      description: 'Investimento em startups e projetos tech',
      contribution_amount: 500,
      max_members: 10,
      current_members: 8,
      group_type: 'order',
      status: 'active',
      total_pool: 4000,
      next_payout_date: '2025-09-20'
    }
  ]

  useEffect(() => {
    // Set mock data
    setUserGroups(mockGroups)
  }, [])

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
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {user?.full_name?.split(' ')[0] || 'Ana'} 👋
            </h1>
            <p className="text-primary-foreground/80">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="relative p-2.5 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors">
              <Bell className="w-5 h-5 text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                3
              </span>
            </button>
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-white/10 backdrop-blur-md border-0 text-white">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-white/80" />
                <span className="text-white/80 font-medium">Saldo da Carteira</span>
              </div>
              <button
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-white/60 hover:text-white transition-colors"
              >
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="text-4xl font-bold mb-6">
              {balanceVisible ? formatCurrency(userStats.wallet_balance) : '••••••'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
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
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-foreground">{userStats.active_groups}</div>
            <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-emerald-600">+24%</div>
            <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-primary">{userStats.trust_score}%</div>
            <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
          </Card>
        </div>

        {/* VIP Banner */}
        {!userStats.is_vip && (
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-900">Upgrade para VIP</h3>
                  <p className="text-xs text-amber-700">Grupos ilimitados e benefícios exclusivos</p>
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => setShowVIPUpgrade(true)}
              >
                Ver mais
              </Button>
            </div>
          </Card>
        )}

        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Os Meus Grupos</h2>
            <Button 
              variant="secondary" 
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Procurar
            </Button>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {userGroups.map((group) => (
              <Card 
                key={group.id} 
                className="p-5 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-foreground text-lg">{group.name}</h3>
                      {group.group_type === 'lottery' && (
                        <Badge variant="secondary">
                          Sorteio
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-primary">
                        {formatCurrency(group.contribution_amount)}/mês
                      </span>
                      <span className="text-muted-foreground">
                        {group.current_members}/{group.max_members} membros
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-foreground">
                      {formatCurrency(group.total_pool)}
                    </div>
                    <div className="text-xs text-muted-foreground">valor total</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {group.status === 'active' ? 'Ativo' : 'Rascunho'}
                  </Badge>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Próximo: {formatDate(group.next_payout_date)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
        currentBalance={userStats.wallet_balance}
      />
      <VIPUpgradeModal
        isOpen={showVIPUpgrade}
        onClose={() => setShowVIPUpgrade(false)}
      />
    </div>
  )
}