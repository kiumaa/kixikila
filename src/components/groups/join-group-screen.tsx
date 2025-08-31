'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Search, Users, Euro, Calendar, Lock, Eye, Globe, Check, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface JoinGroupScreenProps {
  onBack: () => void
}

interface PublicGroup {
  id: string
  name: string
  description: string
  contribution_amount: number
  max_members: number
  current_members: number
  group_type: string
  is_private: boolean
  requires_approval: boolean
  creator_id: string
  users: {
    full_name: string
  }
}

export function JoinGroupScreen({ onBack }: JoinGroupScreenProps) {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [publicGroups, setPublicGroups] = useState<PublicGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [joiningGroups, setJoiningGroups] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPublicGroups()
  }, [])

  const fetchPublicGroups = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('groups')
        .select(`
          id,
          name,
          description,
          contribution_amount,
          max_members,
          current_members,
          group_type,
          is_private,
          requires_approval,
          creator_id,
          users!groups_creator_id_fkey(full_name)
        `)
        .eq('is_private', false)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPublicGroups(data || [])
      
    } catch (error) {
      console.error('Error fetching public groups:', error)
      toast.error('Erro ao carregar grupos públicos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string, requiresApproval: boolean) => {
    if (!user) return

    try {
      setJoiningGroups(prev => new Set(prev).add(groupId))

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single()

      if (existingMember) {
        toast.error('Já é membro deste grupo')
        return
      }

      // Join the group
      const { error: joinError } = await (supabase as any)
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member',
          status: requiresApproval ? 'pending' : 'active',
          joined_at: new Date().toISOString()
        })

      if (joinError) throw joinError

      if (requiresApproval) {
        toast.success('Pedido de adesão enviado! Aguarde aprovação do administrador.')
      } else {
        toast.success('Entrou no grupo com sucesso!')
        
        // Update group member count manually
        await (supabase as any)
          .from('groups')
          .update({ current_members: (supabase as any).raw('current_members + 1') })
          .eq('id', groupId)
      }

      fetchPublicGroups() // Refresh the list

    } catch (error: any) {
      console.error('Error joining group:', error)
      toast.error('Erro ao entrar no grupo: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setJoiningGroups(prev => {
        const newSet = new Set(prev)
        newSet.delete(groupId)
        return newSet
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const filteredGroups = publicGroups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-hover px-6 pt-14 pb-8">
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
          <div>
            <h1 className="text-xl font-bold text-primary-foreground">Procurar Grupos</h1>
            <p className="text-primary-foreground/80 text-sm">Encontre grupos públicos para participar</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
          <Input
            placeholder="Pesquisar grupos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
          />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary/20 border-t-primary"></div>
          </div>
        ) : filteredGroups.length > 0 ? (
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <Card key={group.id} className="p-5 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-foreground text-lg">{group.name}</h3>
                      <div className="flex items-center gap-1">
                        {group.is_private ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Globe className="w-4 h-4 text-emerald-600" />
                        )}
                        {group.group_type === 'lottery' && (
                          <Badge variant="secondary">Sorteio</Badge>
                        )}
                      </div>
                    </div>
                    
                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-3">{group.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-primary">
                        {formatCurrency(group.contribution_amount)}/mês
                      </span>
                      <span className="text-muted-foreground">
                        {group.current_members}/{group.max_members} membros
                      </span>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-2">
                      Criado por: {group.users.full_name}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Button
                      onClick={() => handleJoinGroup(group.id, group.requires_approval)}
                      disabled={joiningGroups.has(group.id)}
                      size="sm"
                      className="ml-4"
                    >
                      {joiningGroups.has(group.id) ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                      ) : group.requires_approval ? (
                        <Clock className="w-4 h-4 mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {group.requires_approval ? 'Pedir' : 'Entrar'}
                    </Button>
                  </div>
                </div>
                
                {/* Progress bar for member count */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Ocupação</span>
                    <span className="text-xs font-medium text-foreground">
                      {Math.round((group.current_members / group.max_members) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
                      style={{ width: `${(group.current_members / group.max_members) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={group.requires_approval ? 'secondary' : 'default'}>
                      {group.requires_approval ? (
                        <>
                          <Clock className="w-3 h-3 mr-1" />
                          Aprovação
                        </>
                      ) : (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Entrada Livre
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    {group.current_members < group.max_members ? (
                      <span className="text-emerald-600">Vagas disponíveis</span>
                    ) : (
                      <span className="text-red-600">Grupo cheio</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">
              {searchQuery ? 'Nenhum grupo encontrado' : 'Não há grupos públicos disponíveis'}
            </p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                Tente pesquisar com termos diferentes
              </p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}