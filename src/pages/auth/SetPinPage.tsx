import React, { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
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

  const handlePinInput = (value: string, digit: number) => {
    if (!/^\d*$/.test(value)) return; // Only numbers
    
    if (step === 'create') {
      const newPin = pin.split('');
      newPin[digit] = value;
      setPin(newPin.join('').slice(0, 4));
    } else {
      const newPin = confirmPin.split('');
      newPin[digit] = value;
      setConfirmPin(newPin.join('').slice(0, 4));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, digit: number) => {
    if (e.key === 'Backspace') {
      if (step === 'create') {
        const newPin = pin.split('');
        newPin[digit] = '';
        setPin(newPin.join(''));
        
        // Focus previous input
        if (digit > 0) {
          const prevInput = e.currentTarget.parentElement?.children[digit - 1] as HTMLInputElement;
          prevInput?.focus();
        }
      } else {
        const newPin = confirmPin.split('');
        newPin[digit] = '';
        setConfirmPin(newPin.join(''));
        
        // Focus previous input
        if (digit > 0) {
          const prevInput = e.currentTarget.parentElement?.children[digit - 1] as HTMLInputElement;
          prevInput?.focus();
        }
      }
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
            {/* PIN Input */}
            <div>
              <div className="flex gap-4 justify-center mb-4">
                {[0, 1, 2, 3].map((digit) => (
                  <input
                    key={digit}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={step === 'create' ? pin[digit] || '' : confirmPin[digit] || ''}
                    onChange={(e) => {
                      handlePinInput(e.target.value, digit);
                      // Auto-focus next input
                      if (e.target.value && digit < 3) {
                        const nextInput = e.target.parentElement?.children[digit + 1] as HTMLInputElement;
                        nextInput?.focus();
                      }
                    }}
                    onKeyDown={(e) => handleKeyDown(e, digit)}
                    className="w-16 h-16 text-center text-2xl font-bold border-2 border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {/* PIN Strength Indicator */}
              {step === 'create' && pin.length > 0 && (
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    {pin.length === 4 ? (
                      <>
                        <Check className="w-4 h-4 text-success" />
                        <span className="text-success">PIN completo</span>
                      </>
                    ) : (
                      <>
                        <div className="w-4 h-4 border-2 border-muted-foreground rounded-full animate-spin" />
                        <span className="text-muted-foreground">
                          {pin.length}/4 dígitos
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Confirmation Status */}
              {step === 'confirm' && confirmPin.length === 4 && (
                <div className="text-center">
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
                </div>
              )}
            </div>

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

            {/* Security Note */}
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Segurança do PIN</p>
                  <p className="text-muted-foreground">
                    Seu PIN será usado para acesso rápido ao app em dispositivos confiáveis. 
                    Nunca compartilhe com outras pessoas.
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