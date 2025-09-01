'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useNavigate } from 'react-router-dom'
import { 
  Wallet, Users, TrendingUp, Crown, Bell, Eye, EyeOff, 
  Upload, Download, History, Plus, UserPlus, Search, 
  ArrowRight, Sparkles, ChevronRight
} from 'lucide-react'

import { MobileButton } from '@/components/ui/mobile-button'
import { MobileCard } from '@/components/ui/mobile-card'
import { Badge } from '@/components/ui/badge'
import { DepositModal } from '@/components/modals/deposit-modal'
import { VIPUpgradeModal } from '@/components/modals/vip-upgrade-modal'
import { CreateGroupModal } from '@/components/modals/create-group-modal'
import { GroupCard } from '@/components/dashboard/group-card'
import { WalletSkeleton, GroupCardSkeleton, StatCardSkeleton } from '@/components/dashboard/skeleton-loaders'
import { formatCurrency } from '@/lib/utils'
import { GroupDetailsScreen } from '@/components/groups/group-details-screen'
import { AnimatedPage } from '@/components/ui/animated-page'

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

export function MobileDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showVIPUpgrade, setShowVIPUpgrade] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [userGroups, setUserGroups] = useState<Group[]>([])
  const [recommendedGroups, setRecommendedGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'group-details'>('dashboard')
  const [unreadNotifications] = useState(3)
  const [userStats, setUserStats] = useState({
    wallet_balance: 1250.50,
    total_saved: 5420.80,
    total_earned: 3200.00,
    active_groups: 3,
    trust_score: 98,
    is_vip: user?.is_vip || false
  })

  // Mock data (same as before but organized for mobile)
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

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setUserGroups(mockUserGroups)
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate refresh
    await new Promise(resolve => setTimeout(resolve, 1000))
    setUserGroups(mockUserGroups)
    setIsLoading(false)
  }

  const handleViewGroupDetails = (groupId: string) => {
    setSelectedGroupId(groupId)
    setCurrentView('group-details')
  }

  const handleBackToDashboard = () => {
    setSelectedGroupId(null)
    setCurrentView('dashboard')
  }

  if (!user) {
    return (
      <AnimatedPage title="Erro">
        <MobileCard className="p-8 text-center mt-20">
          <p className="text-muted-foreground">Utilizador não autenticado</p>
        </MobileCard>
      </AnimatedPage>
    )
  }

  // Show group details screen
  if (currentView === 'group-details' && selectedGroupId) {
    return (
      <GroupDetailsScreen 
        groupId={selectedGroupId}
        onBack={handleBackToDashboard}
      />
    )
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile First Header */}
      <div className="bg-gradient-to-r from-primary to-primary/90 px-4 pt-12 pb-24">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {user?.full_name?.split(' ')[0] || 'Ana'} 👋
            </h1>
            <p className="text-primary-foreground/80 text-sm">
              {new Date().toLocaleDateString('pt-PT', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-3 bg-white/20 backdrop-blur-sm rounded-2xl hover:bg-white/30 transition-colors native-tap"
            >
              <Bell className="w-5 h-5 text-white" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </button>
            <MobileButton
              variant="secondary"
              size="sm"
              fullWidth={false}
              className="bg-white/20 hover:bg-white/30 text-white border-0 px-4"
              onClick={() => setShowVIPUpgrade(true)}
            >
              <Crown className="w-4 h-4" />
              VIP
            </MobileButton>
          </div>
        </div>

        {/* Mobile Wallet Balance Card */}
        {isLoading ? (
          <WalletSkeleton />
        ) : (
          <MobileCard 
            variant="glass"
            pressable
            className="text-white border-white/20"
            onClick={() => navigate('/wallet')}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Wallet className="w-5 h-5 text-white/80" />
                  <span className="text-white/80 font-medium">Saldo da Carteira</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setBalanceVisible(!balanceVisible)
                  }}
                  className="text-white/60 hover:text-white transition-colors p-2 native-tap"
                >
                  {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              <div className="text-3xl font-bold mb-5">
                {balanceVisible ? formatCurrency(userStats.wallet_balance) : '••••••'}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <MobileButton 
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeposit(true)
                  }}
                >
                  <Upload className="w-4 h-4" />
                  Depositar
                </MobileButton>
                <MobileButton 
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Download className="w-4 h-4" />
                  Levantar
                </MobileButton>
                <MobileButton 
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate('/wallet')
                  }}
                >
                  <History className="w-4 h-4" />
                  Histórico
                </MobileButton>
              </div>
            </div>
          </MobileCard>
        )}
      </div>

      {/* Mobile First Content */}
      <div className="px-4 -mt-12 space-y-4 pb-6">
        {/* Mobile Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          {isLoading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <MobileCard className="p-3 text-center">
                <div className="text-xl font-bold text-foreground">{userStats.active_groups}</div>
                <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
              </MobileCard>
              <MobileCard className="p-3 text-center">
                <div className="text-xl font-bold text-success">+24%</div>
                <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
              </MobileCard>
              <MobileCard className="p-3 text-center">
                <div className="text-xl font-bold text-primary">{userStats.trust_score}%</div>
                <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
              </MobileCard>
            </>
          )}
        </div>

        {/* Mobile Quick Actions */}
        <MobileCard className="p-4">
          <h3 className="font-semibold text-foreground mb-4">Atalhos Rápidos</h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setShowCreateGroup(true)}
              className="flex flex-col items-center gap-2 p-3 hover:bg-muted/50 rounded-xl transition-colors native-tap"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Criar Grupo</span>
            </button>
            
            <button
              onClick={() => setShowDeposit(true)}
              className="flex flex-col items-center gap-2 p-3 hover:bg-muted/50 rounded-xl transition-colors native-tap"
            >
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center">
                <Upload className="w-5 h-5 text-success" />
              </div>
              <span className="text-xs font-medium text-foreground">Depositar</span>
            </button>

            <button
              onClick={() => navigate('/invite')}
              className="flex flex-col items-center gap-2 p-3 hover:bg-muted/50 rounded-xl transition-colors native-tap"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground">Convidar</span>
            </button>
          </div>
        </MobileCard>

        {/* VIP Banner - Mobile Optimized */}
        {!userStats.is_vip && (
          <MobileCard className="bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warning text-sm">Upgrade para VIP</h3>
                  <p className="text-xs text-warning/80">Grupos ilimitados e benefícios exclusivos</p>
                </div>
              </div>
              <MobileButton 
                size="sm"
                fullWidth={false}
                className="px-4"
                onClick={() => setShowVIPUpgrade(true)}
              >
                Ver mais
              </MobileButton>
            </div>
          </MobileCard>
        )}

        {/* My Groups Section - Mobile First */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Os Meus Grupos</h2>
            <MobileButton variant="outline" size="sm" fullWidth={false}>
              <Search className="w-4 h-4" />
              Procurar
            </MobileButton>
          </div>

          <div className="space-y-3">
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
              <MobileCard className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Ainda não tens grupos</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Cria o teu primeiro grupo ou adere a um existente
                </p>
                <MobileButton onClick={() => setShowCreateGroup(true)}>
                  <Plus className="w-4 h-4" />
                  Criar Primeiro Grupo
                </MobileButton>
              </MobileCard>
            )}
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
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
      />
    </div>
  )
}