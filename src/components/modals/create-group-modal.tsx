'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, ArrowRight, ArrowLeft, Users, Settings, FileText, Send } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    contributionAmount: '',
    maxMembers: '8',
    frequency: 'monthly',
    groupType: 'lottery',
    isPrivate: true,
    requiresApproval: true
  })

  if (!isOpen) return null

  const steps = [
    { number: 1, title: 'Informações Básicas', icon: FileText },
    { number: 2, title: 'Configurações', icon: Settings },
    { number: 3, title: 'Regras', icon: Users },
    { number: 4, title: 'Finalizar', icon: Send }
  ]

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1)
    } else if (currentStep === 4) {
      handleCreateGroup()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleCreateGroup = async () => {
    if (!user) {
      toast.error('Utilizador não autenticado')
      return
    }

    try {
      setIsSubmitting(true)

      // Create the group
      const { data: group, error: groupError } = await (supabase as any)
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          contribution_amount: parseFloat(groupData.contributionAmount),
          max_members: parseInt(groupData.maxMembers),
          group_type: groupData.groupType === 'lottery' ? 'lottery' : 'savings',
          is_private: groupData.isPrivate,
          requires_approval: groupData.requiresApproval,
          creator_id: user.id,
          status: 'draft',
          contribution_frequency: groupData.frequency
        })
        .select()
        .single()

      if (groupError) throw groupError
      if (!group) throw new Error('Falha ao criar grupo')

      // Add creator as first member
      const { error: memberError } = await (supabase as any)
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'creator',
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (memberError) throw memberError

      toast.success('Grupo criado com sucesso!')
      
      // Reset form and close modal
      setGroupData({
        name: '',
        description: '',
        contributionAmount: '',
        maxMembers: '8',
        frequency: 'monthly',
        groupType: 'lottery',
        isPrivate: true,
        requiresApproval: true
      })
      setCurrentStep(1)
      onClose()

    } catch (error: any) {
      console.error('Error creating group:', error)
      toast.error('Erro ao criar grupo: ' + (error.message || 'Erro desconhecido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <Input
              placeholder="Nome do grupo"
              value={groupData.name}
              onChange={(e) => setGroupData({...groupData, name: e.target.value})}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={groupData.description}
              onChange={(e) => setGroupData({...groupData, description: e.target.value})}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Valor mensal (€)"
                value={groupData.contributionAmount}
                onChange={(e) => setGroupData({...groupData, contributionAmount: e.target.value})}
                min="1"
                step="0.01"
              />
              <Input
                type="number"
                placeholder="Máx. membros"
                value={groupData.maxMembers}
                onChange={(e) => setGroupData({...groupData, maxMembers: e.target.value})}
                min="2"
                max="20"
              />
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de Grupo</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setGroupData({...groupData, groupType: 'lottery'})}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    groupData.groupType === 'lottery' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">Sorteio</div>
                  <div className="text-xs text-muted-foreground">Contemplado por sorteio</div>
                </button>
                <button
                  onClick={() => setGroupData({...groupData, groupType: 'order'})}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    groupData.groupType === 'order' 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="font-medium">Ordem</div>
                  <div className="text-xs text-muted-foreground">Por ordem de entrada</div>
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupData.isPrivate}
                  onChange={(e) => setGroupData({...groupData, isPrivate: e.target.checked})}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <div>
                  <div className="font-medium">Grupo Privado</div>
                  <div className="text-xs text-muted-foreground">Apenas por convite</div>
                </div>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={groupData.requiresApproval}
                  onChange={(e) => setGroupData({...groupData, requiresApproval: e.target.checked})}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <div>
                  <div className="font-medium">Aprovação Obrigatória</div>
                  <div className="text-xs text-muted-foreground">Admin deve aprovar membros</div>
                </div>
              </label>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Regras do Grupo</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Pagamentos até dia 15 de cada mês</li>
                <li>• Atraso resulta em exclusão do sorteio</li>
                <li>• Contemplado deve aguardar nova ronda</li>
                <li>• Grupo dissolve-se após todos contemplados</li>
              </ul>
            </div>
            
            <div className="bg-primary/10 rounded-lg p-4">
              <h4 className="font-medium text-primary mb-2">Resumo</h4>
              <div className="text-sm space-y-1">
                <div><strong>Nome:</strong> {groupData.name || 'Não definido'}</div>
                <div><strong>Valor:</strong> €{groupData.contributionAmount || '0'}/mês</div>
                <div><strong>Membros:</strong> {groupData.maxMembers}</div>
                <div><strong>Tipo:</strong> {groupData.groupType === 'lottery' ? 'Sorteio' : 'Ordem'}</div>
                <div><strong>Privacidade:</strong> {groupData.isPrivate ? 'Privado' : 'Público'}</div>
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Pronto para Criar!</h3>
              <p className="text-muted-foreground text-sm mb-6">
                Confirme os dados e crie o seu grupo
              </p>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nome:</span>
                  <span className="font-medium">{groupData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contribuição:</span>
                  <span className="font-medium">€{groupData.contributionAmount}/mês</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Máx. Membros:</span>
                  <span className="font-medium">{groupData.maxMembers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium">{groupData.groupType === 'lottery' ? 'Sorteio' : 'Ordem'}</span>
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return groupData.name.trim() && groupData.contributionAmount && parseFloat(groupData.contributionAmount) > 0
      case 2:
      case 3:
        return true
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card z-10 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Criar Grupo</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Steps Indicator */}
          <div className="flex items-center justify-between mt-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= step.number 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{steps[currentStep - 1].title}</h3>
            {renderStepContent()}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
            )}
            
            <Button
              onClick={currentStep === 4 ? handleNext : handleNext}
              className="flex-1"
              disabled={!isStepValid() || isSubmitting}
            >
              {currentStep === 4 ? 'Criar Grupo' : 'Continuar'}
              {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}