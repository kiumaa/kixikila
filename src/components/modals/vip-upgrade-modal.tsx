'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Crown, Check, Sparkles, Users, BarChart3, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface VIPUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
}

export function VIPUpgradeModal({ isOpen, onClose }: VIPUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState('premium')
  const [isLoading, setIsLoading] = useState(false)

  const plans = [
    {
      id: 'premium',
      name: 'Premium',
      price: 9.99,
      period: 'mês',
      description: 'Perfeito para utilizadores ativos',
      features: [
        'Grupos ilimitados',
        'Estatísticas avançadas', 
        'Suporte prioritário',
        'Comissões reduzidas',
        'Convites ilimitados'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 19.99,
      period: 'mês',
      description: 'Para utilizadores profissionais',
      features: [
        'Tudo do Premium',
        'API access',
        'Relatórios personalizados',
        'Gestão de múltiplas contas',
        'Consultoria 1-1'
      ],
      popular: false
    }
  ]

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const plan = plans.find(p => p.id === selectedPlan)
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: selectedPlan === 'premium' ? 'price_premium_monthly' : 'price_pro_monthly',
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      // Open Stripe checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Upgrade error:', error)
      toast.error(error.message || 'Erro ao processar upgrade')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Upgrade para VIP</h2>
            <p className="text-muted-foreground">Desbloqueie todo o potencial do KIXIKILA</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {plans.map((plan) => (
              <Card 
                key={plan.id}
                className={`p-6 cursor-pointer transition-all relative ${
                  selectedPlan === plan.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-lg'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
                  <div className="text-3xl font-bold text-foreground">
                    €{plan.price}
                    <span className="text-sm text-muted-foreground font-normal">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Benefícios VIP
            </h4>
            <div className="grid gap-3 md:grid-cols-3 text-sm">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Grupos Ilimitados</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span>Analytics Avançadas</span>
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                <span>Badge VIP</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                'A processar...'
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade para {plans.find(p => p.id === selectedPlan)?.name}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}