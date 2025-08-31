import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Phone, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { InternationalPhoneInput } from '@/components/ui/international-phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useMockAuthStore } from '@/stores/useMockAuthStore';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sendOTP, 
    verifyOTP, 
    createUser,
    isLoading, 
    error, 
    clearError,
    isAuthenticated 
  } = useMockAuthStore();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    acceptTerms: false
  });
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

  const isFormValid = 
    formData.name.trim() !== '' &&
    formData.email.trim() !== '' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) &&
    formData.phone.trim() !== '' &&
    formData.phone.length >= 10 &&
    formData.acceptTerms;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos e aceite os termos",
        variant: "destructive",
      });
      return;
    }

    const result = await sendOTP(formData.phone);
    
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

    const result = await verifyOTP(formData.phone, otp);
    
    if (result.success && result.user) {
      // Update user with additional data
      const updatedUser = {
        ...result.user,
        name: formData.name,
        email: formData.email
      };
      
      toast({
        title: "Conta criada! 🎉",
        description: "Redirecionando para configurar PIN...",
      });
      // Redirect is handled by useEffect above
    }
  };

  const handleResendOTP = async () => {
    const result = await sendOTP(formData.phone);
    
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
    setFormData(prev => ({ ...prev, phone: fullPhone }));
  };

  const handleOtpComplete = (otpValue: string) => {
    setOtp(otpValue);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          <button
            onClick={step === 'otp' ? () => setStep('form') : () => navigate('/')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 'otp' ? 'Voltar ao formulário' : 'Voltar'}
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-success to-success-hover rounded-3xl flex items-center justify-center shadow-lg">
              {step === 'form' ? (
                <User className="w-10 h-10 text-success-foreground" />
              ) : (
                <Lock className="w-10 h-10 text-success-foreground" />
              )}
            </div>
            <h1 className="text-3xl font-bold font-system text-foreground mb-2">
              {step === 'form' ? 'Criar Conta' : 'Verificar código'}
            </h1>
            <p className="text-muted-foreground">
              {step === 'form' 
                ? 'Junte-se à comunidade KIXIKILA' 
                : `Código enviado para ${formData.phone}`
              }
            </p>
          </div>

          {step === 'form' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Nome completo
                </Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ana Santos"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="ana.santos@email.pt"
                    className="pl-10"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-foreground">
                  Número de telefone
                </Label>
                <div className="mt-2">
                  <InternationalPhoneInput
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    defaultCountry="PT"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) =>
                    setFormData(prev => ({ ...prev, acceptTerms: !!checked }))
                  }
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                  Li e aceito os{' '}
                  <button type="button" className="text-primary hover:underline font-medium">
                    Termos de Serviço
                  </button>
                  {' '}e a{' '}
                  <button type="button" className="text-primary hover:underline font-medium">
                    Política de Privacidade
                  </button>
                </Label>
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Phone className="w-4 h-4 mr-2" />
                    Continuar
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth/login')}
                    className="text-primary font-semibold hover:text-primary-hover transition-colors"
                  >
                    Fazer login
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
                    Verificar e criar conta
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

export default SignupPage;