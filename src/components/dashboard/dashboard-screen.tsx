'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  Wallet, 
  Eye, 
  EyeOff, 
  Upload, 
  Download, 
  Plus, 
  Users,
  TrendingUp,
  Crown,
  Calendar,
  ArrowRight,
  Sparkles,
  History
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { CreateGroupModal } from '@/components/modals/create-group-modal'

interface Group {
  id: string
  name: string
  description: string
  contribution_amount: number
  max_members: number
  current_members: number
  group_type: 'savings' | 'lottery' | 'investment'
  status: 'draft' | 'active' | 'paused' | 'completed'
  next_payout_date: string
  total_pool: number
  is_private: boolean
  members?: GroupMember[]
}

interface GroupMember {
  id: string
  user_id: string
  role: 'creator' | 'admin' | 'member'
  status: 'pending' | 'active' | 'inactive'
  total_contributed: number
  users?: {
    full_name: string
    avatar_url?: string
  }
}

interface UserData {
  id: string
  full_name: string
  email: string
  phone: string
  wallet_balance: number
  total_saved: number
  total_earned: number
  total_withdrawn: number
  active_groups: number
  completed_cycles: number
  trust_score: number
  is_vip: boolean
  vip_expiry_date?: string
  avatar_url?: string
}

export function DashboardScreen() {
  const { user } = useAuth()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchUserGroups()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (error) throw error
      setUserData(data)
    } catch (error: any) {
      console.error('Error fetching user data:', error)
      toast.error('Erro ao carregar dados do utilizador')
    }
  }

  const fetchUserGroups = async () => {
    try {
      setLoading(true)
      
      // Get user's group memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          *,
          groups:group_id (
            *
          )
        `)
        .eq('user_id', user?.id)
        .neq('status', 'inactive')

      if (membershipError) throw membershipError

      // Extract groups from memberships
      const userGroups = memberships?.map((membership: any) => ({
        ...membership.groups,
        membership_role: membership.role,
        membership_status: membership.status,
        total_contributed: membership.total_contributed
      })) || []

      // Get member counts and details for each group
      const groupsWithMembers = await Promise.all(
        userGroups.map(async (group) => {
          const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select(`
              *,
              users:user_id (
                full_name,
                avatar_url
              )
            `)
            .eq('group_id', group.id)
            .eq('status', 'active')

          if (membersError) {
            console.error('Error fetching group members:', membersError)
            return group
          }

          return {
            ...group,
            current_members: members?.length || 0,
            members: members || []
          }
        })
      )

      setGroups(groupsWithMembers)
    } catch (error: any) {
      console.error('Error fetching groups:', error)
      toast.error('Erro ao carregar grupos')
    } finally {
      setLoading(false)
    }
  }

  const handleDepositClick = () => {
    toast.info('Funcionalidade de depósito em desenvolvimento')
  }

  const handleWithdrawClick = () => {
    toast.info('Funcionalidade de levantamento em desenvolvimento')
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getGroupStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'draft': return 'bg-yellow-100 text-yellow-700'
      case 'paused': return 'bg-orange-100 text-orange-700'
      case 'completed': return 'bg-blue-100 text-blue-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'lottery': return <Sparkles className="w-4 h-4" />
      case 'investment': return <TrendingUp className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (loading || !userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A carregar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {userData.full_name.split(' ')[0]} 👋
            </h1>
            <p className="text-primary-foreground/80">
              {new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground"
            >
              <Bell className="w-5 h-5" />
            </Button>
            {userData.is_vip && (
              <div className="p-2 bg-yellow-500/20 rounded-xl">
                <Crown className="w-5 h-5 text-yellow-500" />
              </div>
            )}
          </div>
        </div>

        {/* Wallet Balance Card */}
        <Card className="bg-primary-foreground/10 backdrop-blur-md border-0 text-primary-foreground -mx-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-5 h-5 text-primary-foreground/80" />
                <span className="text-primary-foreground/80 font-medium">Saldo da Carteira</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBalanceVisible(!balanceVisible)}
                className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                {balanceVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
            
            <div className="text-4xl font-bold mb-6">
              {balanceVisible ? formatCurrency(userData.wallet_balance) : '••••••'}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                onClick={handleDepositClick}
              >
                <Upload className="w-4 h-4 mr-2" />
                Depositar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
                onClick={handleWithdrawClick}
              >
                <Download className="w-4 h-4 mr-2" />
                Levantar
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                className="flex-1 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-0"
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-foreground">{userData.active_groups}</div>
            <div className="text-xs text-muted-foreground mt-1">Grupos Ativos</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-success">
              {userData.total_earned > 0 ? `+${((userData.total_earned / userData.total_saved) * 100).toFixed(0)}%` : '0%'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">Rentabilidade</div>
          </Card>
          <Card className="p-4 text-center hover:shadow-lg transition-all">
            <div className="text-2xl font-bold text-primary">{userData.trust_score}%</div>
            <div className="text-xs text-muted-foreground mt-1">Trust Score</div>
          </Card>
        </div>

        {/* VIP Banner */}
        {!userData.is_vip && (
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-900">Upgrade para VIP</h3>
                  <p className="text-xs text-yellow-700">Grupos ilimitados e benefícios exclusivos</p>
                </div>
              </div>
              <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                Ver mais
              </Button>
            </div>
          </Card>
        )}

        {/* Groups Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Os Meus Grupos</h2>
            <div className="flex gap-2">
              <Button 
                variant="secondary" 
                size="sm"
                className="text-xs"
              >
                <Users className="w-4 h-4 mr-1" />
                Procurar
              </Button>
              <Button 
                size="sm"
                onClick={() => setShowCreateGroup(true)}
                className="text-xs"
              >
                <Plus className="w-4 h-4 mr-1" />
                Criar
              </Button>
            </div>
          </div>

          {/* Group Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'active', label: 'Ativos' },
              { key: 'draft', label: 'Rascunhos' },
              { key: 'completed', label: 'Concluídos' }
            ].map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="text-xs whitespace-nowrap"
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {groups
              .filter(group => activeTab === 'all' || group.status === activeTab)
              .map((group) => (
                <Card 
                  key={group.id} 
                  className="p-5 hover:shadow-lg transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground text-lg">
                          {group.name}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getGroupTypeIcon(group.group_type)}
                          <Badge variant="secondary" className={getGroupStatusColor(group.status)}>
                            {group.status === 'active' ? 'Ativo' : 
                             group.status === 'draft' ? 'Rascunho' :
                             group.status === 'paused' ? 'Pausado' : 'Concluído'}
                          </Badge>
                        </div>
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
                  
                  {/* Members Preview */}
                  <div className="flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.members?.slice(0, 5).map((member, idx) => (
                        <Avatar key={member.id} className="w-8 h-8 ring-2 ring-background">
                          <AvatarImage src={member.users?.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member.users?.full_name || 'U')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {(group.members?.length || 0) > 5 && (
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-xs font-semibold text-muted-foreground ring-2 ring-background">
                          +{(group.members?.length || 0) - 5}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Próximo: {new Date(group.next_payout_date).toLocaleDateString('pt-PT')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              ))}

            {groups.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-2">Ainda não tem grupos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie o seu primeiro grupo de poupança ou junte-se a um existente
                </p>
                <Button onClick={() => setShowCreateGroup(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Grupo
                </Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal 
        isOpen={showCreateGroup} 
        onClose={() => {
          setShowCreateGroup(false)
          fetchUserGroups()
        }}
      />
    </div>
  )
}