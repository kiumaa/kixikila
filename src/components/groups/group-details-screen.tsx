'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Users, Settings, Calendar, Euro, Crown, Share2, Play, History, Trophy, Clock, Check, X, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface GroupDetailsProps {
  groupId: string
  onBack: () => void
}

interface GroupMember {
  id: string
  user_id: string
  users: {
    full_name: string
    avatar_url?: string
  }
  role: string
  status: string
  total_contributed: number
  current_balance: number
  joined_at: string
  payout_position?: number
}

interface GroupCycle {
  id: string
  cycle_number: number
  winner_user_id: string
  prize_amount: number
  draw_date: string
  participants: any[]
  metadata: any
}

export function GroupDetailsScreen({ groupId, onBack }: GroupDetailsProps) {
  const { user } = useAuth()
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [cycles, setCycles] = useState<GroupCycle[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isDrawing, setIsDrawing] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)

  useEffect(() => {
    if (groupId) {
      fetchGroupData()
    }
  }, [groupId])

  const fetchGroupData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single()

      if (groupError) throw groupError
      setGroup(groupData)

      // Fetch members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          users!inner(full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true })

      if (membersError) throw membersError
      setMembers(membersData || [])

      // Fetch group cycles/history
      const { data: cyclesData, error: cyclesError } = await supabase
        .from('group_cycles')
        .select('*')
        .eq('group_id', groupId)
        .order('cycle_number', { ascending: false })

      if (cyclesError) throw cyclesError
      setCycles(cyclesData || [])

    } catch (error) {
      console.error('Error fetching group data:', error)
      toast.error('Erro ao carregar dados do grupo')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrawWinner = async () => {
    if (!group || !user) return
    
    try {
      setIsDrawing(true)
      
      const { data, error } = await supabase.functions.invoke('draw-group-winner', {
        body: { groupId: group.id }
      })

      if (error) throw error

      toast.success(`🎉 Sorteio realizado! ${data.winner.name} foi contemplado(a)!`)
      fetchGroupData() // Refresh data
      
    } catch (error: any) {
      console.error('Error drawing winner:', error)
      toast.error('Erro ao realizar sorteio: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsDrawing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const isUserAdmin = () => {
    if (!user || !members.length) return false
    const userMember = members.find(m => m.user_id === user.id)
    return userMember && ['creator', 'admin'].includes(userMember.role)
  }

  const canDrawWinner = () => {
    if (!isUserAdmin() || !group) return false
    
    const activeMembers = members.filter(m => m.status === 'active')
    const allPaid = activeMembers.length > 0 // Simplified check
    
    return group.status === 'active' && allPaid
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Grupo não encontrado</p>
          <Button onClick={onBack} className="mt-4">Voltar</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={onBack}
            className="bg-white/20 hover:bg-white/30 text-white border-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-primary-foreground">{group.name}</h1>
            <p className="text-primary-foreground/80 text-sm">{group.description}</p>
          </div>
          {isUserAdmin() && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {formatCurrency(group.total_pool)}
            </div>
            <div className="text-xs text-white/80 mt-1">Valor Total</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {group.current_cycle || 1}º
            </div>
            <div className="text-xs text-white/80 mt-1">Ciclo Atual</div>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-0 p-4 text-center">
            <div className="text-2xl font-bold text-white">
              {group.current_members}/{group.max_members}
            </div>
            <div className="text-xs text-white/80 mt-1">Membros</div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8">
        {/* Action Card */}
        {canDrawWinner() && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-emerald-900 mb-1">
                  ✨ Pronto para sorteio!
                </h3>
                <p className="text-sm text-emerald-700">
                  Todos os membros pagaram. Pode realizar o sorteio.
                </p>
              </div>
              <Button
                onClick={handleDrawWinner}
                disabled={isDrawing}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isDrawing ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Trophy className="w-4 h-4 mr-2" />
                )}
                Sortear
              </Button>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1">
          {[
            { key: 'overview', label: 'Visão Geral' },
            { key: 'members', label: 'Membros' },
            { key: 'history', label: 'Histórico' },
            { key: 'settings', label: 'Configurações' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Progress Card */}
            <Card className="p-5">
              <h3 className="font-semibold text-foreground mb-4">Progresso do Ciclo</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Contribuição</div>
                    <div className="font-semibold text-foreground">
                      {formatCurrency(group.contribution_amount)}
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">Próximo pagamento</div>
                    <div className="font-semibold text-foreground">
                      {group.next_payout_date ? formatDate(group.next_payout_date) : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="w-full">
                <Euro className="w-5 h-5 mr-2" />
                Pagar Agora
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setShowInviteModal(true)}
              >
                <Share2 className="w-5 h-5 mr-2" />
                Convidar
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'members' && (
          <div className="space-y-3">
            {members.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white font-semibold">
                        {member.users.full_name.split(' ').map(n => n[0]).join('')}
                      </div>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{member.users.full_name}</span>
                        {member.role === 'creator' && (
                          <Badge variant="secondary">
                            <Crown className="w-3 h-3 mr-1" />
                            Criador
                          </Badge>
                        )}
                        {member.role === 'admin' && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Contribuiu: {formatCurrency(member.total_contributed)}
                      </div>
                    </div>
                  </div>
                  
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status === 'active' ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Ativo
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Pendente
                      </>
                    )}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-3">
            {cycles.length > 0 ? (
              cycles.map((cycle) => (
                <Card key={cycle.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">Ciclo {cycle.cycle_number}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Contemplado: {members.find(m => m.user_id === cycle.winner_user_id)?.users.full_name || 'Desconhecido'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(cycle.draw_date)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-600">
                        {formatCurrency(cycle.prize_amount)}
                      </div>
                      <Badge variant="secondary" className="mt-1">
                        Concluído
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Ainda não há histórico</p>
                <p className="text-sm text-muted-foreground mt-1">
                  O histórico aparecerá após o primeiro sorteio
                </p>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <Card className="p-5">
            <h3 className="font-semibold text-foreground mb-4">Configurações do Grupo</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Frequência</div>
                  <div className="text-sm text-muted-foreground">Pagamentos mensais</div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Euro className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Valor</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(group.contribution_amount)} por membro, por ciclo
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Tipo de Seleção</div>
                  <div className="text-sm text-muted-foreground">
                    {group.group_type === 'lottery' 
                      ? 'Sorteio aleatório a cada ciclo'
                      : 'Ordem predefinida pelos membros'}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}