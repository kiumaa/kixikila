import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Phone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  onRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onBack,
  onSuccess,
  onRegister
}) => {
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    if (phone.length >= 9) {
      setIsLoading(true);
      // Simulate OTP sending
      setTimeout(() => {
        setStep('otp');
        setIsLoading(false);
        setResendTimer(60);
        toast({
          title: "Código enviado",
          description: `SMS enviado para +351 ${phone}`,
        });
      }, 1500);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length === 6) {
      setIsLoading(true);
      // Simulate OTP verification
      setTimeout(() => {
        setIsLoading(false);
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao KIXIKILA",
        });
        onSuccess();
      }, 2000);
    }
  };

  const handleResendOTP = () => {
    setResendTimer(60);
    toast({
      title: "Código reenviado",
      description: "Novo código SMS enviado",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors ios-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-lg">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold font-system text-foreground mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-muted-foreground">Entre na sua conta KIXIKILA</p>
          </div>

          {step === 'phone' ? (
            <div className="space-y-6">
              <Input
                label="Número de Telemóvel"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="912 345 678"
                icon={<Phone className="w-5 h-5" />}
                helper="Vamos enviar um código SMS para este número"
              />

              <Button
                variant="default"
                size="lg"
                className="w-full ios-button"
                onClick={handleSendOTP}
                disabled={isLoading || phone.length < 9}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Enviar Código SMS'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{' '}
                  <button
                    onClick={onRegister}
                    className="text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-muted-foreground mb-2">Código enviado para</p>
                <p className="font-semibold text-foreground">+351 {phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Código de Verificação
                </label>
                <div className="flex gap-2 justify-center">
                  {[...Array(6)].map((_, i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength="1"
                      value={otpCode[i] || ''}
                      onChange={(e) => {
                        const newOtp = otpCode.split('');
                        newOtp[i] = e.target.value;
                        setOtpCode(newOtp.join(''));
                        if (e.target.value && i < 5) {
                          const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      className="w-12 h-12 text-center text-xl font-bold border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      aria-label={`Dígito ${i + 1} do código`}
                    />
                  ))}
                </div>
              </div>

              <Button
                variant="default"
                size="lg"
                className="w-full ios-button"
                onClick={handleVerifyOTP}
                disabled={isLoading || otpCode.length !== 6}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Verificar e Entrar'}
              </Button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Reenviar código em {resendTimer}s
                  </p>
                ) : (
                  <button
                    onClick={handleResendOTP}
                    className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Reenviar código
                  </button>
                )}
              </div>

              <button
                onClick={() => setStep('phone')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full"
              >
                Alterar número
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};