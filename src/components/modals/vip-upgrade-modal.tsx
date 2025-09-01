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
  const [isLoading, setIsLoading] = useState(false)

  const plan = {
    id: 'pro',
    name: 'Pro',
    originalPrice: 9.99,
    promoPrice: 5.99,
    period: 'mês',
    description: 'Grupos ilimitados e recursos avançados',
    features: [
      'Grupos ilimitados',
      'Estatísticas avançadas', 
      'Suporte prioritário',
      'Comissões reduzidas',
      'Convites ilimitados',
      'Badge Pro'
    ],
    isPromo: true
  }

  const handleUpgrade = async () => {
    setIsLoading(true)
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          plan_type: 'pro_promo_monthly',
          successUrl: `${window.location.origin}/dashboard?upgraded=true`,
          cancelUrl: `${window.location.origin}/dashboard`
        }
      })

      if (error) throw error

      // Open Stripe checkout in new tab
      if (data.url) {
        window.open(data.url, '_blank')
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
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Upgrade para Pro</h2>
            <p className="text-muted-foreground">Desbloqueie todo o potencial do KIXIKILA</p>
            
            {/* Promoção Banner */}
            <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full text-sm font-bold animate-pulse">
              <Sparkles className="w-4 h-4" />
              PROMOÇÃO DE LANÇAMENTO
            </div>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <Card className="p-6 ring-2 ring-primary bg-primary/5 relative overflow-hidden">
              {/* Promoção Badge */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  DESCONTO 40%
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-foreground mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                
                {/* Preços */}
                <div className="space-y-2">
                  <div className="text-lg text-muted-foreground line-through">
                    €{plan.originalPrice}
                  </div>
                  <div className="text-4xl font-bold text-foreground">
                    €{plan.promoPrice}
                    <span className="text-sm text-muted-foreground font-normal">/{plan.period}</span>
                  </div>
                  <p className="text-xs text-orange-600 font-medium">
                    Poupe €{(plan.originalPrice - plan.promoPrice).toFixed(2)}/mês
                  </p>
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
              className="flex-1 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
              disabled={isLoading}
            >
              {isLoading ? (
                'A processar...'
              ) : (
                <>
                  <Crown className="w-4 h-4 mr-2" />
                  Aderir por €{plan.promoPrice}/mês
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}