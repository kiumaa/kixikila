'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useProfile } from '@/hooks/use-profile'
import { useUserGroups } from '@/hooks/use-user-groups'
import { useNavigate } from 'react-router-dom'
import { useAppState } from '@/contexts/app-state-context'
import { useTabState } from '@/hooks/use-tab-state'
import { SmartRefresh } from '@/components/ui/smart-refresh'
import { EmptyState } from '@/components/ui/empty-state'
import { NetworkError, ServerError } from '@/components/ui/enhanced-error-states'
import { useToastSystem } from '@/hooks/use-toast-system'
import { useEnhancedHaptics } from '@/hooks/use-enhanced-haptics'
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
  const { profile, loading: profileLoading } = useProfile()
  const { groups, loading: groupsLoading, refetch: refetchGroups, error: groupsError } = useUserGroups()
  const navigate = useNavigate()
  const toasts = useToastSystem()
  const { interactive, contextual: haptic } = useEnhancedHaptics()
  
  // Tab state management for scroll and filters preservation
  const tabState = useTabState({ tab: 'dashboard', scrollElementId: 'dashboard-content' })
  
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showDeposit, setShowDeposit] = useState(false)
  const [showVIPUpgrade, setShowVIPUpgrade] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'dashboard' | 'group-details'>('dashboard')
  const [unreadNotifications] = useState(3)

  const isLoading = profileLoading || groupsLoading

  // Transform Supabase groups to match Group interface
  const transformedGroups: Group[] = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description || '',
    contribution_amount: Number(group.contribution_amount),
    max_members: group.max_members,
    current_members: group.current_members,
    group_type: group.group_type,
    status: group.status,
    total_pool: Number(group.total_pool),
    next_payout_date: group.next_payout_date || '',
    cycle: group.current_cycle || 1,
    is_member: true
  }))

  const handleRefresh = async () => {
    try {
      await refetchGroups()
      toasts.syncComplete()
    } catch (error) {
      toasts.syncError()
    }
  }

  const handleViewGroupDetails = (groupId: string) => {
    haptic('nav.page')
    setSelectedGroupId(groupId)
    setCurrentView('group-details')
  }

  const handleBackToDashboard = () => {
    haptic('nav.page')
    setSelectedGroupId(null)
    setCurrentView('dashboard')
  }

  const handleBalanceToggle = () => {
    haptic('ui.toggle')
    setBalanceVisible(!balanceVisible)
  }

  const handleButtonPress = (action: string) => {
    haptic('ui.press')
  }

  // Error states with enhanced error components
  if (groupsError && typeof groupsError === 'string' && (groupsError.includes('network') || groupsError.includes('fetch'))) {
    return <NetworkError onRetry={() => refetchGroups()} />
  }
  
  if (groupsError && !groupsLoading) {
    return <ServerError onRetry={() => refetchGroups()} />
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
    <SmartRefresh onRefresh={handleRefresh}>
      <div id="dashboard-content" className="min-h-screen bg-surface">
        {/* Mobile First Header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 px-4 pt-12 pb-24">
          {/* ... keep existing header content */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground mb-1">
                Olá, {profile?.full_name?.split(' ')[0] || user?.full_name?.split(' ')[0] || 'Utilizador'} 👋
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
                onClick={() => {
                  handleButtonPress('notification')
                  navigate('/notifications')
                }}
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
                onClick={() => {
                  handleButtonPress('vip')
                  setShowVIPUpgrade(true)
                }}
              >
                <Crown className="w-4 h-4" />
                VIP
              </MobileButton>
            </div>
          </div>

          {/* Mobile Wallet Balance Card with enhanced haptics */}
          {isLoading ? (
            <WalletSkeleton />
          ) : (
            <MobileCard 
              variant="glass"
              pressable
              className="text-white border-white/20"
              onClick={() => {
                haptic('nav.page')
                navigate('/wallet')
              }}
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
                      handleBalanceToggle()
                    }}
                    className="text-white/60 hover:text-white transition-colors p-2 native-tap"
                  >
                    {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <div className="text-3xl font-bold mb-5">
                  {balanceVisible ? formatCurrency(profile?.wallet_balance || 0) : '••••••'}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <MobileButton 
                    variant="secondary"
                    size="sm"
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleButtonPress('deposit')
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
                    onClick={(e) => {
                      e.stopPropagation()
                      handleButtonPress('withdraw')
                    }}
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
                      haptic('nav.page')
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

        {/* ... keep existing content sections with enhanced feedback */}
        <div className="px-4 -mt-12 space-y-4 pb-6">
          {/* ... keep existing stats and actions sections */}
          
          {/* Empty state with better UX */}
          {!isLoading && transformedGroups.length === 0 && (
            <div className="px-2 py-8">
              <EmptyState
                variant="groups"
                title="Ainda não tem grupos"
                description="Crie o seu primeiro grupo de poupança ou junte-se a um existente para começar a poupar com amigos."
                action={{
                  label: 'Criar Primeiro Grupo',
                  onClick: () => {
                    haptic('group.create')
                    setShowCreateGroup(true)
                  }
                }}
              />
            </div>
          )}
          
          {/* ... keep remaining existing content */}
        </div>
      </div>
    </SmartRefresh>
  )
}