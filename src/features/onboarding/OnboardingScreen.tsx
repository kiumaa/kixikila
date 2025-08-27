import React from 'react';
import { Users, Shield, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import kixikilaLogo from '@/assets/kixikila-logo.png';
interface OnboardingScreenProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}
const features = [{
  icon: <Users className="w-16 h-16 text-primary" />,
  title: "Poupança Colaborativa",
  description: "Junte-se a grupos de poupança e alcance os seus objetivos financeiros mais rapidamente com total transparência"
}, {
  icon: <Shield className="w-16 h-16 text-success" />,
  title: "100% Seguro",
  description: "Transações protegidas com Stripe, verificação KYC e tecnologia bancária para máxima segurança dos seus fundos"
}, {
  icon: <Wallet className="w-16 h-16 text-warning" />,
  title: "Carteira Digital",
  description: "Gerencie os seus fundos facilmente com depósitos instantâneos, levantamentos rápidos e histórico completo"
}];
export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  step,
  onNext,
  onSkip
}) => {
  return <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Skip Button */}
        <div className="flex justify-end mb-6">
          <Button variant="ghost" size="sm" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
            Saltar
          </Button>
        </div>

        {step < 3 ? <Card className="ios-card p-8 text-center animate-fade-in">
            <CardContent className="pt-6 space-y-6">
              <div className="flex justify-center">
                {features[step].icon}
              </div>
              <div className="space-y-3">
                <h2 className="text-2xl font-bold font-system text-foreground">
                  {features[step].title}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {features[step].description}
                </p>
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2">
                {[0, 1, 2].map(i => <div key={i} className={`h-2 rounded-full transition-all duration-base ${i === step ? 'w-8 bg-primary' : 'w-2 bg-muted'}`} />)}
              </div>

              <Button variant="default" size="lg" className="w-full ios-button" onClick={onNext}>
                Continuar
              </Button>
            </CardContent>
          </Card> : <Card className="ios-card p-8 text-center animate-scale-in">
            <CardContent className="pt-6 space-y-6">
              <img src={kixikilaLogo} alt="KIXIKILA" className="w-24 h-24 mx-auto" />
              
              <div className="space-y-3">
                
                <p className="text-lg text-muted-foreground">
                  A forma mais inteligente de poupar em grupo
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <Button variant="default" size="lg" className="w-full ios-button" onClick={onNext}>
                  Criar Conta
                </Button>
                <Button variant="outline" size="lg" className="w-full ios-button" onClick={onSkip}>
                  Já tenho conta
                </Button>
              </div>
            </CardContent>
          </Card>}
      </div>
    </div>;
};