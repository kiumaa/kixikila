import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';

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
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpTimer, setOtpTimer] = useState(0);
  const { toast } = useToast();
  const { sendPhoneOtp, verifyPhoneOtp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro no login",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, insira seu número de telefone",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPhoneOtp(phone);
      setStep('otp');
      setOtpTimer(60);
      toast({
        title: "Código enviado!",
        description: `Código OTP enviado para ${phone}`,
      });
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Por favor, insira o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyPhoneOtp(phone, otp);
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta ao KIXIKILA",
      });
      onSuccess();
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleResendOtp = async () => {
    try {
      await sendPhoneOtp(phone);
      setOtpTimer(60);
      toast({
        title: "Código reenviado!",
        description: `Novo código OTP enviado para ${phone}`,
      });
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setOtpTimer(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          <button
            onClick={step === 'otp' ? handleBackToPhone : onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors ios-button"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'otp' ? 'Alterar telefone' : 'Voltar'}
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-hover rounded-3xl flex items-center justify-center shadow-lg">
              {step === 'phone' ? (
                <Phone className="w-10 h-10 text-primary-foreground" />
              ) : (
                <Lock className="w-10 h-10 text-primary-foreground" />
              )}
            </div>
            <h1 className="text-3xl font-bold font-system text-foreground mb-2">
              {step === 'phone' ? 'Bem-vindo de volta' : 'Verificar código'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'phone' 
                ? 'Entre com seu número de telefone' 
                : `Código enviado para ${phone}`
              }
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Número de telefone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="912 345 678"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full ios-button"
                disabled={isLoading || !phone}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Enviar código'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={onRegister}
                    className="text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Código de verificação
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full ios-button"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Verificar código'}
              </Button>

              <div className="text-center">
                {otpTimer > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Reenviar código em {otpTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors"
                    disabled={isLoading}
                  >
                    Reenviar código
                  </button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};