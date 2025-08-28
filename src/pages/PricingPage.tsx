import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStripeIntegration } from '@/hooks/useStripeIntegration';
import { useNavigate } from 'react-router-dom';
import { 
  Check, 
  Crown, 
  Users, 
  TrendingUp, 
  Shield, 
  Star, 
  Sparkles,
  ArrowLeft,
  Zap
} from 'lucide-react';

interface PlanFeatures {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  buttonText: string;
  disabled: boolean;
  limitations?: string[];
  savings?: string;
}

export const PricingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<'vip_monthly' | 'vip_yearly'>('vip_monthly');
  const { createVIPCheckout, loading } = useStripeIntegration();
  const navigate = useNavigate();

  const plans: Record<string, PlanFeatures> = {
    free: {
      name: 'Gratuito',
      price: '€0',
      period: '/sempre',
      description: 'Perfeito para começar',
      features: [
        'Até 2 grupos',
        'Funcionalidades básicas',
        'Suporte por email',
        'Notificações básicas'
      ],
      limitations: [
        'Limitado a 2 grupos',
        'Relatórios básicos',
        'Sem personalização'
      ],
      popular: false,
      buttonText: 'Plano Atual',
      disabled: true
    },
    vip_monthly: {
      name: 'VIP Mensal',
      price: '€9,99',
      period: '/mês',
      description: 'Para utilizadores frequentes',
      features: [
        'Grupos ilimitados',
        'Análises avançadas',
        'Suporte prioritário',
        'Personalização completa',
        'Funcionalidades beta',
        'Relatórios detalhados'
      ],
      popular: false,
      buttonText: 'Começar VIP Mensal',
      disabled: false
    },
    vip_yearly: {
      name: 'VIP Anual',
      price: '€99,99',
      period: '/ano',
      description: 'Melhor valor - 2 meses grátis',
      features: [
        'Tudo do plano mensal',
        '2 meses grátis (€119,88 → €99,99)',
        'Desconto de 17%',
        'Suporte VIP premium',
        'Acesso antecipado a features'
      ],
      popular: true,
      buttonText: 'Começar VIP Anual',
      disabled: false,
      savings: 'Poupa €19,89'
    }
  };

  const handleSelectPlan = async (planKey: string) => {
    if (planKey === 'free') return;
    
    const planType = planKey as 'vip_monthly' | 'vip_yearly';
    const result = await createVIPCheckout(planType);
    
    if (!result.success) {
      console.error('Failed to create checkout:', result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 pt-14 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Planos KIXIKILA</h1>
              <p className="text-indigo-100">Escolha o plano perfeito para si</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 -mt-8">
        <div className="grid md:grid-cols-3 gap-6">
          {Object.entries(plans).map(([key, plan]) => (
            <Card
              key={key}
              className={`relative p-6 transition-all duration-200 ${
                plan.popular 
                  ? 'ring-2 ring-indigo-500 shadow-xl scale-105' 
                  : 'hover:shadow-lg'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              
              {plan.savings && (
                <Badge className="absolute -top-3 right-4 bg-emerald-500 text-white">
                  {plan.savings}
                </Badge>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  {key === 'free' ? (
                    <Users className="w-6 h-6 text-white" />
                  ) : key === 'vip_monthly' ? (
                    <Crown className="w-6 h-6 text-white" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-white" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Limitations (for free plan) */}
              {plan.limitations && (
                <div className="space-y-2 mb-6 pb-6 border-b">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Limitações
                  </p>
                  {plan.limitations.map((limitation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full border border-gray-300 mt-0.5 flex-shrink-0"></div>
                      <span className="text-sm text-gray-500">{limitation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
                    : key === 'free'
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => handleSelectPlan(key)}
                disabled={plan.disabled || loading}
                variant={plan.popular ? 'default' : key === 'free' ? 'secondary' : 'outline'}
              >
                {loading && key !== 'free' ? (
                  'A processar...'
                ) : (
                  <>
                    {key !== 'free' && <Zap className="w-4 h-4 mr-2" />}
                    {plan.buttonText}
                  </>
                )}
              </Button>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600 text-sm">
                Sim! Pode cancelar a sua subscrição a qualquer momento através do portal de gestão. 
                Não há contratos ou taxas de cancelamento.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                O que acontece aos meus grupos se cancelar?
              </h3>
              <p className="text-gray-600 text-sm">
                Os seus grupos existentes permanecerão ativos. Apenas não poderá criar novos grupos 
                além do limite gratuito de 2 grupos.
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">
                Os pagamentos são seguros?
              </h3>
              <p className="text-gray-600 text-sm">
                Sim! Utilizamos o Stripe para processamento de pagamentos, garantindo máxima segurança 
                e proteção dos seus dados financeiros.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};