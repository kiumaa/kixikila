import React, { useState, useEffect, Suspense } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoginScreen } from '@/routes/LazyRoutes';
import PinSetupScreen from '@/features/auth/PinSetupScreen';
import PinUnlockScreen from '@/features/auth/PinUnlockScreen';
import { Loader2, ArrowLeft, Phone, User, Mail, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LabeledInput } from '@/components/ui/labeled-input';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { useToast } from '@/hooks/use-toast';

const AuthPage = () => {
  const { isAuthenticated, sendPhoneOtp, verifyPhoneOtp, error, isLoading } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [authType, setAuthType] = useState<'login' | 'register' | 'pin_setup' | 'pin_unlock'>('login');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const { toast } = useToast();

  // Register form data
  const [registerData, setRegisterData] = useState({
    full_name: '',
    email: '',
    phone: '',
    acceptTerms: false
  });
  const [otpCode, setOtpCode] = useState('');

  // Get auth type from URL params
  useEffect(() => {
    const type = searchParams.get('type');
    if (type === 'register') {
      setAuthType('register');
    } else if (type === 'pin_setup') {
      setAuthType('pin_setup');
    } else if (type === 'pin') {
      setAuthType('pin_unlock');
    } else {
      setAuthType('login'); 
    }
  }, [searchParams]);

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
    return <Navigate to="/app" replace />;
  }

  const handleBack = () => {
    window.location.href = '/';
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerData.acceptTerms) {
      toast({
        variant: "destructive",
        title: "Termos obrigatórios",
        description: "Deve aceitar os termos para continuar"
      });
      return;
    }

    try {
      // Send OTP first
      const result = await sendPhoneOtp(registerData.phone);
      if (result.success) {
        setStep('otp');
        toast({
          title: "Código enviado",
          description: "Verifique o SMS no seu telemóvel"
        });
      }
    } catch (error) {
      console.error('Register error:', error);
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (otpCode.length !== 6) return;

    try {
      console.log('AuthPage: Starting OTP verification...');
      const result = await verifyPhoneOtp(registerData.phone, otpCode);

      if (result.success) {
        console.log('AuthPage: OTP verification successful - redirect handled by AuthStore');
        toast({
          title: "✅ Sucesso!",
          description: result.message
        });
        // Note: AuthStore handles automatic redirect to /app/dashboard
        // No manual redirect needed here
      } else {
        console.error('AuthPage: OTP verification failed:', result.message);
        toast({
          variant: "destructive",
          title: "Erro na verificação",
          description: result.message
        });
      }
    } catch (error) {
      console.error('AuthPage: OTP verification error:', error);
      toast({
        variant: "destructive", 
        title: "Erro",
        description: "Erro na verificação do código. Tente novamente."
      });
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpCode(value);
    if (value.length === 6) {
      handleVerifyOTP();
    }
  };

  const handlePinSetupComplete = () => {
    // After PIN setup, redirect to dashboard
    setTimeout(() => {
      window.location.href = '/app/dashboard';
    }, 500);
  };

  const handlePinUnlockSuccess = () => {
    // After PIN unlock, redirect to dashboard  
    setTimeout(() => {
      window.location.href = '/app/dashboard';
    }, 500);
  };

  const handlePinFallbackToOtp = () => {
    setAuthType('login');
    window.history.pushState({}, '', '/entrar?type=login');
  };

  const isFormValid = registerData.full_name && registerData.phone && registerData.acceptTerms;

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen">
      <Suspense 
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground font-system">
                Carregando...
              </p>
            </div>
          </div>
        }
      >
        {authType === 'login' ? (
          <LoginScreen
            onBack={handleBack}
            onSuccess={() => {}}
            onRegister={() => setAuthType('register')}
          />
        ) : authType === 'register' ? (
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
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center shadow-xl">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Criar Conta</h1>
                <p className="text-muted-foreground">Junte-se à comunidade KIXIKILA</p>
              </div>

              {step === 'form' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <LabeledInput
                    label="Nome Completo"
                    value={registerData.full_name}
                    onChange={(e) => setRegisterData({...registerData, full_name: e.target.value})}
                    placeholder="Ana Santos"
                    icon={<User className="w-5 h-5" />}
                    required
                  />

                  <LabeledInput
                    label="Email (opcional)"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    placeholder="ana.santos@email.pt"
                    icon={<Mail className="w-5 h-5" />}
                  />

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Número de Telemóvel *
                    </label>
                    <InternationalPhoneInput
                      value={registerData.phone}
                      onChange={(phone) => setRegisterData({...registerData, phone})}
                      placeholder="912 345 678"
                      required
                    />
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={registerData.acceptTerms}
                      onChange={(e) => setRegisterData({...registerData, acceptTerms: e.target.checked})}
                      className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                    />
                    <span className="text-sm text-muted-foreground">
                      Li e aceito os{' '}
                      <button type="button" className="text-primary hover:underline">Termos de Serviço</button>
                      {' '}e a{' '}
                      <button type="button" className="text-primary hover:underline">Política de Privacidade</button>
                    </span>
                  </label>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!isFormValid || isLoading}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Continuar
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Já tem conta?{' '}
                      <button
                        type="button"
                        onClick={() => setAuthType('login')}
                        className="text-primary font-semibold hover:underline"
                      >
                        Fazer login
                      </button>
                    </p>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground mb-2">Código enviado para</p>
                    <p className="font-semibold text-foreground">{registerData.phone}</p>
                  </div>

                  <form onSubmit={handleVerifyOTP}>
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
                      Verificar Código
                    </Button>
                  </form>

                  <button
                    onClick={() => setStep('form')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors text-center w-full"
                  >
                    Voltar
                  </button>
                </div>
              )}
            </Card>
          </div>
        ) : authType === 'pin_setup' ? (
          <PinSetupScreen
            onBack={handleBack}
            onComplete={handlePinSetupComplete}
            userPhone={searchParams.get('phone') || ''}
            rememberDevice={true}
          />
        ) : authType === 'pin_unlock' ? (
          <PinUnlockScreen
            onSuccess={handlePinUnlockSuccess}
            onFallbackToOtp={handlePinFallbackToOtp}
            userPhone={searchParams.get('phone') || ''}
            userName={searchParams.get('name') || undefined}
          />
        ) : null}
      </Suspense>
    </div>
  );
};

export default AuthPage;