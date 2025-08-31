import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, ArrowLeft, Phone } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { useToast } from '@/hooks/use-toast';

const SignupPage = () => {
  const { 
    isAuthenticated, 
    sendPhoneOtp, 
    verifyPhoneOtp, 
    error, 
    isLoading, 
    getNextRoute 
  } = useAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const { toast } = useToast();

  // Show errors as toast
  useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error,
      });
    }
  }, [error, toast]);

  // Redirect authenticated users
  if (isAuthenticated) {
    const nextRoute = getNextRoute();
    return <Navigate to={nextRoute} replace />;
  }

  const handleBack = () => {
    if (step === 'phone') {
      window.location.href = '/';
    } else {
      setStep('phone');
      setOtpCode('');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 9) {
      toast({
        variant: "destructive",
        title: "Número inválido",
        description: "Por favor insira um número de telemóvel válido"
      });
      return;
    }

    try {
      const result = await sendPhoneOtp(phone);
      if (result.success) {
        setStep('otp');
        toast({
          title: "Código enviado",
          description: "Verifique o SMS no seu telemóvel"
        });
      }
    } catch (error) {
      console.error('Send OTP error:', error);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (otpCode.length !== 6) return;

    try {
      const result = await verifyPhoneOtp(phone, otpCode);
      if (result.success) {
        toast({
          title: "✅ Bem-vindo!",
          description: "Conta criada com sucesso"
        });
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    if (value.length === 6) {
      handleVerifyOtp();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md p-8">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl flex items-center justify-center shadow-xl bg-gradient-to-br from-emerald-500 to-green-500">
            <Phone className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {step === 'phone' ? 'Criar Conta' : 'Verificar Código'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'phone' 
              ? 'Digite o seu número para criar uma conta nova'
              : 'Digite o código que recebeu por SMS'
            }
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Número de Telemóvel
              </label>
              <InternationalPhoneInput
                value={phone}
                onChange={setPhone}
                placeholder="912 345 678"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!phone || isLoading}
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Criar Conta com SMS
            </Button>

            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                Ao criar conta, aceita os nossos{' '}
                <button type="button" className="text-primary hover:underline">
                  Termos de Serviço
                </button>
              </p>
              
              <div className="pt-2 border-t">
                <Link
                  to="/login"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Já tem conta? Entrar aqui
                </Link>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <p className="text-muted-foreground mb-2">Código enviado para</p>
              <p className="font-semibold text-foreground">{phone}</p>
            </div>

            <form onSubmit={handleVerifyOtp}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Código de Verificação
                </label>
                <OtpInput
                  value={otpCode}
                  onChange={handleOtpChange}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={otpCode.length !== 6 || isLoading}
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Conta e Entrar
              </Button>
            </form>

            <div className="text-center">
              <button
                onClick={() => handleSendOtp(new Event('submit') as any)}
                className="text-sm text-primary hover:underline"
                disabled={isLoading}
              >
                Reenviar código
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default SignupPage;