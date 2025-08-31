import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Shield, Users, Wallet, Sparkles, Crown, Award, Zap } from 'lucide-react';

const OnboardingScreen = () => {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const onboardingSteps = [
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Bem-vindo ao KIXIKILA! 🎉",
      description: "Acabou de se juntar à plataforma de poupança colaborativa mais avançada de Angola"
    },
    {
      icon: <Shield className="w-12 h-12 text-emerald-500" />,
      title: "Segurança Máxima 🔐",
      description: "PIN de 4 dígitos, dispositivos confiáveis e verificação KYC completa"
    },
    {
      icon: <Wallet className="w-12 h-12 text-blue-500" />,
      title: "Carteira Digital 💳",
      description: "Deposite, levante e gerencie fundos com total facilidade via Stripe"
    },
    {
      icon: <Crown className="w-12 h-12 text-amber-500" />,
      title: "Sistema VIP Premium ⭐",
      description: "Grupos ilimitados, relatórios avançados e suporte prioritário"
    }
  ];

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      navigate('/app/profile/kyc');
    }
  };

  const handleSkip = () => {
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <Card className="p-8 text-center">
          <div className="mb-6">{onboardingSteps[step].icon}</div>
          
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {onboardingSteps[step].title}
          </h2>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {onboardingSteps[step].description}
          </p>
          
          {/* Progress indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {onboardingSteps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleNext}
              className="w-full"
            >
              {step === onboardingSteps.length - 1 ? 'Completar KYC' : 'Continuar'}
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full text-muted-foreground"
            >
              {step === onboardingSteps.length - 1 ? 'Fazer mais tarde' : 'Pular introdução'}
            </Button>
          </div>
        </Card>

        {/* Features showcase at the end */}
        {step === onboardingSteps.length - 1 && (
          <Card className="mt-4 p-4">
            <h3 className="font-semibold text-foreground mb-3 text-center">
              Funcionalidades Ativadas ✅
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { icon: <Zap className="w-4 h-4" />, text: "Autenticação SMS internacional" },
                { icon: <Shield className="w-4 h-4" />, text: "PIN seguro de 4 dígitos" },
                { icon: <Award className="w-4 h-4" />, text: "Dispositivos confiáveis" },
                { icon: <Users className="w-4 h-4" />, text: "Grupos de poupança" },
                { icon: <Sparkles className="w-4 h-4" />, text: "KYC verification completo" }
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                  <div className="text-emerald-500">{feature.icon}</div>
                  {feature.text}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;