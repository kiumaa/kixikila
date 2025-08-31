import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { PinDisplay } from '@/components/ui/pin-display';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { useToast } from '@/hooks/use-toast';
import { useMockAuthStore } from '@/stores/useMockAuthStore';

const SetPinPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user } = useMockAuthStore();

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, user, navigate]);

  const handleKeyPress = (key: string) => {
    const currentPin = step === 'create' ? pin : confirmPin;
    
    if (currentPin.length < 4) {
      const newPin = currentPin + key;
      if (step === 'create') {
        setPin(newPin);
      } else {
        setConfirmPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const handleContinue = () => {
    if (pin.length !== 4) {
      toast({
        title: "PIN incompleto",
        description: "O PIN deve ter 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    setStep('confirm');
    setConfirmPin('');
  };

  const handleConfirm = async () => {
    if (confirmPin.length !== 4) {
      toast({
        title: "PIN incompleto",
        description: "Confirme o PIN com 4 dígitos",
        variant: "destructive",
      });
      return;
    }

    if (pin !== confirmPin) {
      toast({
        title: "PINs não coincidem",
        description: "Os PINs inseridos não são iguais. Tente novamente.",
        variant: "destructive",
      });
      setStep('create');
      setPin('');
      setConfirmPin('');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate saving PIN (in real app would hash and save)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save PIN to localStorage (mock implementation)
      localStorage.setItem('mock_user_pin', JSON.stringify({
        userId: user?.id,
        pinHash: btoa(pin), // Simple encoding for demo
        createdAt: new Date().toISOString()
      }));

      toast({
        title: "PIN definido com sucesso! 🎉",
        description: "Sua conta está pronta. Redirecionando...",
      });

      // Redirect to main app after short delay
      setTimeout(() => {
        navigate('/auth/app');
      }, 1500);

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar PIN. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
    } else {
      navigate('/auth/login');
    }
  };

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            disabled={isLoading}
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-warning to-warning-hover rounded-3xl flex items-center justify-center shadow-lg">
              <Shield className="w-10 h-10 text-warning-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-system text-foreground mb-2">
              {step === 'create' ? 'Definir PIN' : 'Confirmar PIN'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'create' 
                ? 'Crie um PIN de 4 dígitos para acesso rápido' 
                : 'Digite novamente seu PIN para confirmar'
              }
            </p>
          </div>

          <div className="space-y-8">
            {/* PIN Display */}
            <div className="space-y-6">
              <PinDisplay 
                value={step === 'create' ? pin : confirmPin} 
                showValues={false}
              />

              {/* Status Indicator */}
              <div className="text-center min-h-[24px]">
                {step === 'create' && pin.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {pin.length === 4 ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-success">PIN completo</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        {pin.length}/4 dígitos
                      </span>
                    )}
                  </div>
                )}

                {step === 'confirm' && confirmPin.length === 4 && (
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {pin === confirmPin ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-success">PINs coincidem</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-destructive" />
                        <span className="text-destructive">PINs não coincidem</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Numeric Keypad */}
            <NumericKeypad
              onKeyPress={handleKeyPress}
              onDelete={handleDelete}
              disabled={isLoading}
            />

            {/* Action Button */}
            <Button
              onClick={step === 'create' ? handleContinue : handleConfirm}
              disabled={
                isLoading || 
                (step === 'create' && pin.length !== 4) ||
                (step === 'confirm' && (confirmPin.length !== 4 || pin !== confirmPin))
              }
              variant="default"
              size="lg"
              className="w-full"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : step === 'create' ? (
                'Continuar'
              ) : (
                'Confirmar PIN'
              )}
            </Button>

            {/* Trusted Device Note */}
            <div className="bg-muted/50 p-4 rounded-2xl border border-border/50">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Dispositivo Confiável</p>
                  <p className="text-muted-foreground">
                    Após definir o PIN, este dispositivo será marcado como confiável para acesso rápido.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPinPage;