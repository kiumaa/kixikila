import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Crown, Calendar, CreditCard, Star, Gift, 
  TrendingUp, Zap, Award, Shield, CheckCircle, X, Lock,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { formatCurrency, formatDate } from '@/lib/mockData';
import { useVIPStatus } from '@/hooks/useVIPStatus';
import { useStripeIntegration } from '@/hooks/useStripeIntegration';
import { toast } from '@/hooks/use-toast';

interface VIPManagementScreenProps {
  onBack: () => void;
}

export const VIPManagementScreen: React.FC<VIPManagementScreenProps> = ({ onBack }) => {
  const [selectedPlan, setSelectedPlan] = useState<'vip_monthly' | 'vip_yearly'>('vip_yearly');
  const { 
    isVIP, 
    planType, 
    expiryDate, 
    loading: statusLoading, 
    groupCount, 
    refreshStatus 
  } = useVIPStatus();
  
  const { 
    createVIPCheckout, 
    openCustomerPortal, 
    loading: stripeLoading 
  } = useStripeIntegration();

  // Refresh status on mount
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const handleUpgrade = async () => {
    const result = await createVIPCheckout(selectedPlan);
    if (result.success) {
      toast({
        title: "Redirecionado para o pagamento",
        description: "Complete o seu upgrade no Stripe.",
      });
    }
  };

  const handleManageSubscription = async () => {
    const result = await openCustomerPortal();
    if (result.success) {
      toast({
        title: "Portal de gestão aberto",
        description: "Pode gerir a sua subscrição no Stripe.",
      });
    }
  };

  const vipFeatures = [
    {
      icon: <Star className="w-5 h-5 text-warning" />,
      title: "Grupos Ilimitados",
      description: "Participe em quantos grupos quiser sem limitações"
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-success" />,
      title: "Relatórios Avançados",
      description: "Analytics detalhados dos seus investimentos e poupanças"
    },
    {
      icon: <Zap className="w-5 h-5 text-primary" />,
      title: "Suporte Prioritário",
      description: "Atendimento VIP com resposta em menos de 2 horas"
    },
    {
      icon: <Award className="w-5 h-5 text-purple-500" />,
      title: "Badges Exclusivos",
      description: "Status especial e reconhecimento na comunidade"
    },
    {
      icon: <Gift className="w-5 h-5 text-pink-500" />,
      title: "Ofertas Especiais",
      description: "Acesso antecipado a novas funcionalidades e promoções"
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "Segurança Premium",
      description: "Autenticação biométrica e backup em nuvem"
    }
  ];

  const plans = {
    vip_monthly: {
      price: 9.99,
      period: "mês",
      savings: null,
      name: "VIP Mensal"
    },
    vip_yearly: {
      price: 99.99,
      period: "ano",
      savings: "Poupa €19.89",
      name: "VIP Anual"
    }
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-muted-foreground">A carregar estado VIP...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-warning to-warning-hover px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-warning-foreground/80 hover:text-warning-foreground hover:bg-warning-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-foreground">
            Gestão VIP
          </h1>
        </div>

        {/* Current Status */}
        <Card className={`backdrop-blur-md border-0 ios-card ${
          isVIP ? 'bg-warning/10' : 'bg-muted/10'
        }`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {isVIP ? (
                  <Crown className="w-8 h-8 text-warning" />
                ) : (
                  <Shield className="w-8 h-8 text-muted-foreground" />
                )}
                <div>
                  <h2 className="text-xl font-bold font-system text-foreground">
                    {isVIP ? 'Plano VIP Ativo' : 'Plano Gratuito'}
                  </h2>
                   <p className="text-muted-foreground text-sm font-system">
                     {isVIP 
                       ? expiryDate ? `Válido até ${formatDate(expiryDate)}` : 'Subscrição ativa'
                       : 'Participa em até 2 grupos por convite.'
                     }
                   </p>
                </div>
              </div>
              <Badge variant={isVIP ? 'default' : 'secondary'} className="font-semibold">
                {isVIP ? 'VIP' : 'GRATUITO'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold font-system text-foreground">
                  {isVIP ? '∞' : `${groupCount}/2`}
                </div>
                <div className="text-xs text-muted-foreground">Grupos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-system text-foreground">
                  {isVIP ? '24h' : '48h'}
                </div>
                <div className="text-xs text-muted-foreground">Suporte</div>
              </div>
            </div>

            {isVIP ? (
              <div className="bg-warning/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-system text-foreground">
                    {planType === 'vip_yearly' ? 'Subscrição Anual' : 'Subscrição Mensal'}
                  </span>
                  <span className="text-sm font-bold font-system text-foreground">
                    {planType === 'vip_yearly' ? formatCurrency(99.99) : formatCurrency(9.99)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {expiryDate ? `Renovação em ${formatDate(expiryDate)}` : 'Subscrição ativa'}
                </div>
                <div className="mt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleManageSubscription}
                    disabled={stripeLoading}
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Gerir
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={refreshStatus}
                    disabled={statusLoading}
                  >
                    <RefreshCw className={`w-3 h-3 mr-1 ${statusLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-system text-foreground">
                    Liberta todo o potencial do KIXIKILA
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Grupos ilimitados</div>
                  <div>Suporte prioritário</div>
                  <div>Relatórios avançados</div>
                  <div>Funcionalidades Premium</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* VIP Features */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold font-system text-foreground">
                Benefícios VIP
              </h3>
            </div>
            <div className="divide-y divide-border">
              {vipFeatures.map((feature, idx) => (
                <div key={idx} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold font-system text-foreground mb-1">
                        {feature.title}
                      </h4>
                      <p className="text-sm text-muted-foreground font-system leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Billing Management */}
        <Card className="ios-card">
          <CardContent className="p-5">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Planos Disponíveis
            </h3>
            
            {/* Plan Toggle */}
            <div className="flex bg-surface rounded-xl p-1 mb-6">
              <button
                onClick={() => setSelectedPlan('vip_monthly')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium font-system transition-all ${
                  selectedPlan === 'vip_monthly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setSelectedPlan('vip_yearly')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium font-system transition-all relative ${
                  selectedPlan === 'vip_yearly'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                Anual
                {plans.vip_yearly.savings && (
                  <span className="absolute -top-2 -right-2 bg-success text-success-foreground text-xs px-2 py-0.5 rounded-full">
                    {plans.vip_yearly.savings}
                  </span>
                )}
              </button>
            </div>

            {/* Selected Plan Details */}
            <div className="bg-gradient-to-r from-primary/10 to-warning/10 rounded-xl p-4 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold font-system text-foreground mb-1">
                  {formatCurrency(plans[selectedPlan].price)}
                </div>
                <div className="text-sm text-muted-foreground font-system">
                  por {plans[selectedPlan].period}
                </div>
                {plans[selectedPlan].savings && (
                  <div className="text-xs text-success font-semibold font-system mt-1">
                    {plans[selectedPlan].savings}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {isVIP ? (
                <>
                  <Button 
                    variant="outline" 
                    className="w-full ios-button"
                    onClick={handleManageSubscription}
                    disabled={stripeLoading}
                  >
                    {stripeLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Gerir Subscrição
                  </Button>
                  <div className="bg-success/10 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">
                        Subscrição VIP Ativa
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Aproveite todas as funcionalidades premium
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="default" 
                    className="w-full ios-button text-lg font-semibold py-4"
                    onClick={handleUpgrade}
                    disabled={stripeLoading}
                  >
                    {stripeLoading ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <Crown className="w-5 h-5 mr-2" />
                    )}
                    Assinar {plans[selectedPlan].name}
                  </Button>
                  <div className="bg-muted/50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Funcionalidades Premium Bloqueadas
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Desbloqueia com o plano VIP
                    </p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Stats */}
        <Card className="ios-card">
          <CardContent className="p-5">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Utilização Este Mês
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-2xl font-bold font-system text-primary">
                  {isVIP ? '∞' : `${groupCount}/2`}
                </div>
                <div className="text-xs text-muted-foreground font-system mt-1">
                  Grupos Permitidos
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-2xl font-bold font-system text-success">
                  {isVIP ? 'Premium' : 'Básico'}
                </div>
                <div className="text-xs text-muted-foreground font-system mt-1">
                  Nível da Conta
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Contact */}
        <Card className="ios-card bg-gradient-to-r from-primary/5 to-success/5">
          <CardContent className="p-5 text-center">
            <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
            <h3 className="font-semibold font-system text-foreground mb-2">
              Suporte VIP
            </h3>
            <p className="text-sm text-muted-foreground font-system mb-4">
              Precisa de ajuda? Nossa equipe VIP está sempre disponível
            </p>
            <Button variant="outline" size="sm" className="ios-button">
              Contactar Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};