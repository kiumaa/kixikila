'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Wallet, Users, TrendingUp, Crown, Bell, Eye, EyeOff, 
  Upload, Download, History, Plus, UserPlus, Search, 
  ArrowRight, Sparkles, ChevronRight
} from 'lucide-react'
import { DepositModal } from '@/components/modals/deposit-modal'
import { VIPUpgradeModal } from '@/components/modals/vip-upgrade-modal'
import { CreateGroupModal } from '@/components/modals/create-group-modal'
import { GroupCard } from '@/components/dashboard/group-card'
import { WalletSkeleton, GroupCardSkeleton, StatCardSkeleton } from '@/components/dashboard/skeleton-loaders'
import { formatCurrency } from '@/lib/utils'

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
  cycle?: number
  is_member?: boolean
}

export function DashboardPage() {
  const { user } = useAuth()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showVIPUpgrade, setShowVIPUpgrade] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userStats, setUserStats] = useState({
    wallet_balance: 1250.50,
    total_saved: 5420.80,
    total_earned: 3200.00,
    active_groups: 3,
    trust_score: 98,
    is_vip: user?.is_vip || false
  })

  // Mock user groups data
  const mockUserGroups: Group[] = [
    {
      id: '1',
      name: 'Família Santos',
      description: 'Poupança familiar para férias de verão na costa algarvia',
      contribution_amount: 100,
      max_members: 8,
      current_members: 7,
      group_type: 'lottery',
      status: 'active',
      total_pool: 700,
      next_payout_date: '2025-09-15',
      cycle: 3,
      is_member: true
    },
    {
      id: '2',
      name: 'Tech Founders',
      description: 'Investimento em startups e projetos tecnológicos',
      contribution_amount: 500,
      max_members: 10,
      current_members: 8,
      group_type: 'order',
      status: 'ready_for_draw',
      total_pool: 4000,
      next_payout_date: '2025-09-20',
      cycle: 1,
      is_member: true
    },
    {
      id: '3',
      name: 'Surf Crew',
      description: 'Material e viagens de surf pelo mundo',
      contribution_amount: 75,
      max_members: 6,
      current_members: 5,
      group_type: 'order',
      status: 'active',
      total_pool: 375,
      next_payout_date: '2025-09-25',
      cycle: 2,
      is_member: true
    }
  ]

  // Mock recommended groups data
  const mockRecommendedGroups: Group[] = [
    {
      id: '4',
      name: 'Casa Própria 2025',
      description: 'Grupo para entrada de casa própria',
      contribution_amount: 300,
      max_members: 12,
      current_members: 9,
      group_type: 'lottery',
      status: 'active',
      total_pool: 2700,
      next_payout_date: '2025-10-01',
      cycle: 2,
      is_member: false
    },
    {
      id: '5',
      name: 'Empreendedores Lisboa',
      description: 'Rede de empreendedores da capital',
      contribution_amount: 250,
      max_members: 15,
      current_members: 12,
      group_type: 'order',
      status: 'active',
      total_pool: 3000,
      next_payout_date: '2025-10-05',
      cycle: 1,
      is_member: false
    },
    {
      id: '6',
      name: 'Estudantes Universitários',
      description: 'Apoio financeiro para estudantes',
      contribution_amount: 50,
      max_members: 20,
      current_members: 15,
      group_type: 'lottery',
      status: 'active',
      total_pool: 750,
      next_payout_date: '2025-09-30',
      cycle: 4,
      is_member: false
    }
  ]

  useEffect(() => {
    // Simulate loading
    setIsLoading(true)
    
    const timer = setTimeout(() => {
      setUserGroups(mockUserGroups)
      setRecommendedGroups(mockRecommendedGroups)
      setIsLoading(false)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleViewGroupDetails = (groupId: string) => {
    console.log('View group details:', groupId)
    // Navigate to group details - mock for now
    alert(`Navegar para detalhes do grupo ${groupId}`)
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {user?.full_name?.split(' ')[0] || 'Ana'} 👋
            </h1>
            <p className="text-primary-foreground/80">
              {new Date().toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
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
        {isLoading ? (
          <WalletSkeleton />
        ) : (
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
        )}
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Atalhos Rápidos</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex flex-col items-center gap-2 p-4 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Criar Grupo</span>
            </button>
            
            <button
              onClick={() => setShowDeposit(true)}
              className="flex flex-col items-center gap-2 p-4 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Depositar</span>
            </button>

            <button className="flex flex-col items-center gap-2 p-4 hover:bg-muted/50 rounded-xl transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-foreground">Convidar</span>
            </button>
          </div>
        </Card>

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

        {/* My Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Os Meus Grupos</h2>
            <Button variant="secondary" size="sm">
              <Search className="w-4 h-4 mr-2" />
              Procurar
            </Button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <GroupCardSkeleton />
                <GroupCardSkeleton />
                <GroupCardSkeleton />
              </>
            ) : userGroups.length > 0 ? (
              userGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onViewDetails={handleViewGroupDetails}
                />
              ))
            ) : (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Ainda não tens grupos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Cria o teu primeiro grupo ou adere a um existente
                </p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* Recommended Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Grupos Recomendados</h2>
            <button className="flex items-center gap-1 text-sm text-primary font-medium hover:text-primary/80 transition-colors">
              Ver todos
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <>
                <GroupCardSkeleton />
                <GroupCardSkeleton />
              </>
            ) : (
              recommendedGroups.slice(0, 3).map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  onViewDetails={handleViewGroupDetails}
                  showJoinButton={true}
                />
              ))
            )}
          </div>
        </div>

        {/* Bottom Padding for TabBar */}
        <div className="pb-4" />
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
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  )
}