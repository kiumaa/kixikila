import { useState } from 'react';
import { Modal } from '@/components/design-system/Modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useStripeIntegration } from '@/hooks/useStripeIntegration';
import { Check, Crown, Sparkles, Users, TrendingUp, Shield, Star } from 'lucide-react';

interface VIPUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VIPUpgradeModal = ({ isOpen, onClose }: VIPUpgradeModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'vip_monthly' | 'vip_yearly'>('vip_monthly');
  const { createVIPCheckout, loading } = useStripeIntegration();

  const plans = {
    vip_monthly: {
      name: 'VIP Mensal',
      price: '€9,99',
      period: '/mês',
      savings: null,
      popular: false,
    },
    vip_yearly: {
      name: 'VIP Anual',
      price: '€99,99',
      period: '/ano',
      savings: '2 meses grátis',
      popular: true,
    }
  };

  const benefits = [
    {
      icon: <Users className="w-5 h-5 text-indigo-600" />,
      title: 'Grupos Ilimitados',
      description: 'Crie e participe em quantos grupos quiser'
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-emerald-600" />,
      title: 'Análises Avançadas',
      description: 'Relatórios detalhados do seu progresso financeiro'
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-600" />,
      title: 'Suporte Prioritário',
      description: 'Atendimento VIP com resposta em 2 horas'
    },
    {
      icon: <Star className="w-5 h-5 text-purple-600" />,
      title: 'Funcionalidades Beta',
      description: 'Acesso antecipado a novas funcionalidades'
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-600" />,
      title: 'Personalização',
      description: 'Temas personalizados e configurações avançadas'
    }
  ];

  const handleUpgrade = async () => {
    const result = await createVIPCheckout(selectedPlan);
    if (result.success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upgrade para VIP
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Desbloqueie o potencial completo do KIXIKILA com funcionalidades premium
          </p>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {Object.entries(plans).map(([key, plan]) => (
            <Card
              key={key}
              className={`relative p-6 cursor-pointer transition-all duration-200 ${
                selectedPlan === key
                  ? 'ring-2 ring-indigo-500 bg-indigo-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan(key as 'vip_monthly' | 'vip_yearly')}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                  Mais Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                {plan.savings && (
                  <Badge variant="secondary" className="text-emerald-600 bg-emerald-100">
                    {plan.savings}
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Benefits */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            O que está incluído:
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm">{benefit.title}</h4>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? 'A processar...' : `Upgrade para ${plans[selectedPlan].name}`}
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Processamento seguro via Stripe • Pode cancelar a qualquer momento
          </p>
        </div>
      </div>
    </Modal>
  );
};