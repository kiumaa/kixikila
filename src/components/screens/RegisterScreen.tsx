import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Mail, Phone, Check, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onBack, onSuccess }) => {
  const [step, setStep] = useState<'form' | 'otp' | 'success'>('form');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [otpCode, setOtpCode] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();
  const { register, verifyOtp, resendOtp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Erro no registro",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    try {
      await register({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
      
      setStep('otp');
      setResendTimer(60);
      toast({
        title: "Código enviado!",
        description: `Verifique o email enviado para ${formData.email}`
      });
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyOtp(formData.email, otpCode, 'email_verification');
      setStep('success');
      
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleResendOTP = async () => {
    try {
      await resendOtp(formData.email, 'email_verification');
      setResendTimer(60);
      toast({
        title: "Código reenviado!",
        description: "Verifique a nova mensagem no email"
      });
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const isFormValid = formData.fullName.trim() !== '' && 
    formData.email.trim() !== '' && 
    formData.phone.trim() !== '' && 
    formData.password.trim() !== '' &&
    formData.confirmPassword.trim() !== '' &&
    formData.acceptTerms;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-slide-up">
        <CardContent className="p-8 space-y-8">
          {step !== 'success' && (
            <Button
              onClick={step === 'form' ? onBack : () => setStep('form')}
              variant="ghost"
              className="mb-4 ios-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}

          {step === 'form' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-success to-success-hover rounded-3xl flex items-center justify-center shadow-lg">
                  <User className="w-10 h-10 text-success-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold font-system text-foreground mb-2">
                    Criar Conta
                  </h1>
                  <p className="text-muted-foreground">
                    Junte-se à comunidade KIXIKILA
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                    Nome Completo
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="Ana Santos"
                      className="ios-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="ana.santos@email.pt"
                      className="ios-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                    Número de Telemóvel
                  </Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="912 345 678"
                      className="ios-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Senha
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Sua senha"
                      className="ios-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                    Confirmar Senha
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Confirme sua senha"
                      className="ios-input pl-12"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({ ...formData, acceptTerms: e.target.checked })}
                    className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                  />
                  <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                    Li e aceito os{' '}
                    <button className="text-primary hover:underline font-medium">
                      Termos de Serviço
                    </button>
                    {' '}e a{' '}
                    <button className="text-primary hover:underline font-medium">
                      Política de Privacidade
                    </button>
                  </Label>
                </div>

                <Button
                  onClick={handleRegister}
                  disabled={!isFormValid || isLoading}
                  className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Criando conta...</span>
                    </div>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Já tem conta?{' '}
                    <button
                      onClick={onBack}
                      className="text-primary font-semibold hover:underline"
                    >
                      Fazer login
                    </button>
                  </p>
                </div>
              </div>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-info to-info-hover rounded-3xl flex items-center justify-center shadow-lg">
                  <Phone className="w-10 h-10 text-info-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold font-system text-foreground mb-2">
                    Verificar Código
                  </h2>
                  <p className="text-muted-foreground mb-2">
                    Código enviado para
                  </p>
                  <p className="font-semibold text-foreground">
                    {formData.email}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-3">
                    Código de Verificação
                  </Label>
                  <div className="flex gap-2 justify-center">
                    {[...Array(6)].map((_, i) => (
                      <Input
                        key={i}
                        type="text"
                        maxLength={1}
                        value={otpCode[i] || ''}
                        onChange={(e) => {
                          const newOtp = otpCode.split('');
                          newOtp[i] = e.target.value;
                          setOtpCode(newOtp.join(''));
                          
                          // Auto-focus next input
                          if (e.target.value && i < 5) {
                            const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                            if (nextInput) nextInput.focus();
                          }
                        }}
                        className="w-12 h-12 text-center text-xl font-bold border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={otpCode.length !== 6 || isLoading}
                  className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Verificando...</span>
                    </div>
                  ) : (
                    'Criar Conta'
                  )}
                </Button>

                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Reenviar código em {resendTimer}s
                    </p>
                  ) : (
                    <button
                      onClick={handleResendOTP}
                      className="text-sm text-primary font-semibold hover:underline"
                    >
                      Reenviar código
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {step === 'success' && (
            <div className="text-center py-8 space-y-6">
              <div className="w-20 h-20 mx-auto bg-success-subtle rounded-full flex items-center justify-center animate-bounce-in">
                <Check className="w-10 h-10 text-success" />
              </div>
              <div>
                <h2 className="text-2xl font-bold font-system text-foreground mb-2">
                  Conta Criada!
                </h2>
                <p className="text-muted-foreground">
                  Bem-vindo ao KIXIKILA, {formData.fullName.split(' ')[0]}!
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};