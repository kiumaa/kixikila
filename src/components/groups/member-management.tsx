'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { 
  Crown, Shield, UserMinus, MessageSquare, Search, 
  MoreVertical, Check, X, AlertTriangle, Mail, Phone
} from 'lucide-react'
import { toast } from 'sonner'

interface Member {
  id: string
  user_id: string
  users: {
    full_name: string
    email?: string
    phone?: string
    avatar_url?: string
  }
  role: string
  status: string
  total_contributed: number
  current_balance: number
  joined_at: string
  payout_position?: number
  last_payment_date?: string
  is_compliant?: boolean
}

interface MemberManagementProps {
  members: Member[]
  groupId: string
  isAdmin: boolean
  onMemberUpdate: () => void
}

export function MemberManagement({ members, groupId, isAdmin, onMemberUpdate }: MemberManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showMemberDetails, setShowMemberDetails] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const filteredMembers = members.filter(member => 
    member.users.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.users.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRemoveMember = async (memberId: string) => {
    if (!isAdmin) return
    
    try {
      setActionLoading(true)
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Membro removido com sucesso')
      onMemberUpdate()
    } catch (error) {
      toast.error('Erro ao remover membro')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePromoteMember = async (memberId: string) => {
    if (!isAdmin) return
    
    try {
      setActionLoading(true)
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Membro promovido a administrador')
      onMemberUpdate()
    } catch (error) {
      toast.error('Erro ao promover membro')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveMember = async (memberId: string) => {
    if (!isAdmin) return
    
    try {
      setActionLoading(true)
      // Mock API call - replace with actual Supabase call
      await new Promise(resolve => setTimeout(resolve, 1000))
      toast.success('Membro aprovado com sucesso')
      onMemberUpdate()
    } catch (error) {
      toast.error('Erro ao aprovar membro')
    } finally {
      setActionLoading(false)
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
      month: 'short'
    })
  }

  const getMemberStatusColor = (status: string, isCompliant?: boolean) => {
    if (!isCompliant) return 'destructive'
    switch (status) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      default: return 'secondary'
    }
  }

  const getMemberStatusText = (status: string, isCompliant?: boolean) => {
    if (!isCompliant) return 'Em falta'
    switch (status) {
      case 'active': return 'Ativo'
      case 'pending': return 'Pendente'
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Controls */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Procurar membros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        {isAdmin && (
          <Button size="sm" variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Convidar
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {member.users.full_name.split(' ').map(n => n[0]).join('')}
                  </div>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">
                      {member.users.full_name}
                    </span>
                    
                    {member.role === 'creator' && (
                      <Badge variant="secondary" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Criador
                      </Badge>
                    )}
                    
                    {member.role === 'admin' && (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <div>Contribuído: {formatCurrency(member.total_contributed)}</div>
                    {member.last_payment_date && (
                      <div>Último pagamento: {formatDate(member.last_payment_date)}</div>
                    )}
                    {member.payout_position && (
                      <div>Posição: #{member.payout_position}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge variant={getMemberStatusColor(member.status, member.is_compliant)}>
                  {!member.is_compliant && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {member.status === 'active' && member.is_compliant && <Check className="w-3 h-3 mr-1" />}
                  {member.status === 'pending' && <X className="w-3 h-3 mr-1" />}
                  {getMemberStatusText(member.status, member.is_compliant)}
                </Badge>
                
                {isAdmin && member.role !== 'creator' && (
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedMember(member)
                        setShowMemberDetails(true)
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Non-compliant member warning */}
            {!member.is_compliant && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-destructive mb-1">
                      Pagamento em atraso
                    </div>
                    <div className="text-muted-foreground">
                      Este membro está impossibilitado de efetuar levantamentos até regularizar a situação.
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline" className="text-xs">
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Contactar
                        </Button>
                        <Button size="sm" variant="destructive" className="text-xs">
                          <UserMinus className="w-3 h-3 mr-1" />
                          Remover
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Member Details Modal */}
      {showMemberDetails && selectedMember && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Ações do Membro</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMemberDetails(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {selectedMember.status === 'pending' && (
                  <Button
                    className="w-full justify-start"
                    onClick={() => handleApproveMember(selectedMember.id)}
                    disabled={actionLoading}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aprovar Membro
                  </Button>
                )}
                
                {selectedMember.role === 'member' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handlePromoteMember(selectedMember.id)}
                    disabled={actionLoading}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Promover a Admin
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  disabled={actionLoading}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </Button>
                
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => handleRemoveMember(selectedMember.id)}
                  disabled={actionLoading}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Remover do Grupo
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}