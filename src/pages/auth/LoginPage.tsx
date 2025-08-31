import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useMockAuthStore } from '@/stores/useMockAuthStore';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sendOTP, 
    verifyOTP, 
    isLoading, 
    error, 
    clearError,
    isAuthenticated 
  } = useMockAuthStore();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/auth/set-pin');
    }
  }, [isAuthenticated, navigate]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // Timer for resend button
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone || phone.length < 10) {
      toast({
        title: "Número inválido",
        description: "Insira um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    const result = await sendOTP(phone);
    
    if (result.success) {
      setStep('otp');
      setResendTimer(60);
      toast({
        title: "Código enviado! 📱",
        description: result.message + " (usar código: 123456)",
      });
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Insira o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyOTP(phone, otp);
    
    if (result.success) {
      toast({
        title: "Login realizado! 🎉",
        description: "Redirecionando para configurar PIN...",
      });
      // Redirect is handled by useEffect above
    }
  };

  const handleResendOTP = async () => {
    const result = await sendOTP(phone);
    
    if (result.success) {
      setOtp('');
      setResendTimer(60);
      toast({
        title: "Código reenviado! 📱",
        description: result.message + " (usar código: 123456)",
      });
    }
  };

  const handlePhoneChange = (fullPhone: string) => {
    setPhone(fullPhone);
  };

  const handleOtpComplete = (otpValue: string) => {
    setOtp(otpValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          <button
            onClick={step === 'otp' ? () => setStep('phone') : () => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
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
              {step === 'phone' ? 'Entrar' : 'Verificar código'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'phone' 
                ? 'Entre com seu número de telefone' 
                : `Código enviado para ${phone}`
              }
            </p>
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-foreground">
                  Número de telefone
                </Label>
                <div className="mt-2">
                  <InternationalPhoneInput
                    value={phone}
                    onChange={handlePhoneChange}
                    defaultCountry="PT"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                disabled={isLoading || !phone}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Enviar código SMS
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Não tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth/signup')}
                    className="text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Criar conta
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-foreground mb-3 block">
                  Código de verificação (6 dígitos)
                </Label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleOtpComplete}
                  disabled={isLoading}
                  autoFocus={true}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  💡 Código para teste: <strong>123456</strong>
                </p>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Verificar código
                  </>
                )}
              </Button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Reenviar código em {resendTimer}s
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors disabled:opacity-50"
                    disabled={isLoading}
                  >
                    📱 Reenviar código
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

export default LoginPage;