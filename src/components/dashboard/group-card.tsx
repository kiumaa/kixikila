'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, Sparkles, Trophy, ArrowRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface GroupCardProps {
  group: {
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
  onViewDetails?: (groupId: string) => void
  showJoinButton?: boolean
}

export function GroupCard({ group, onViewDetails, showJoinButton = false }: GroupCardProps) {
  const progress = (group.current_members / group.max_members) * 100
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'ready_for_draw': return 'bg-blue-100 text-blue-800'
      case 'waiting': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo'
      case 'ready_for_draw': return 'Pronto para Sorteio'
      case 'waiting': return 'Aguardando'
      default: return 'Rascunho'
    }
  }

  return (
    <Card className="p-5 hover:shadow-lg transition-all cursor-pointer group" onClick={() => onViewDetails?.(group.id)}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">
              {group.name}
            </h3>
            {group.group_type === 'lottery' && (
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Sorteio
              </Badge>
            )}
            {group.group_type === 'order' && (
              <Badge variant="secondary" className="text-xs">
                <Trophy className="w-3 h-3 mr-1" />
                Ordem
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {group.description}
          </p>
          
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-primary">
              {formatCurrency(group.contribution_amount)}/mês
            </span>
            <span className="text-muted-foreground">
              {group.current_members}/{group.max_members} membros
            </span>
            {group.cycle && (
              <span className="text-muted-foreground">
                Ciclo {group.cycle}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-foreground mb-1">
            {formatCurrency(group.total_pool)}
          </div>
          <div className="text-xs text-muted-foreground">valor total</div>
        </div>
      </div>
      
      {/* Progress Bar for Member Groups */}
      {group.is_member && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              Progresso do ciclo
            </span>
            <span className="text-xs font-bold text-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary-hover rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(group.status)}>
            {getStatusText(group.status)}
          </Badge>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Próximo: {formatDate(group.next_payout_date)}</span>
          </div>
        </div>
        
        {showJoinButton ? (
          <Button size="sm" variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Aderir
          </Button>
        ) : (
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
      </div>
    </Card>
  )
}