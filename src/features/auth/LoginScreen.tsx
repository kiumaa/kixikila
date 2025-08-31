import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Lock, Shield, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InternationalPhoneInput, Country } from '@/components/ui/international-phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRateLimit } from '@/hooks/useRateLimit';

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
  const [fullPhone, setFullPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [phoneValid, setPhoneValid] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [otpTimer, setOtpTimer] = useState(0);
  const { toast } = useToast();
  const { sendPhoneOtp, verifyPhoneOtp, isLoading, error, clearError } = useAuthStore();
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Rate limiting for OTP requests
  const otpRateLimit = useRateLimit('otp_send', {
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000 // 15 minutes block
  });
  
  // Rate limiting for verification attempts
  const verifyRateLimit = useRateLimit('otp_verify', {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000, // 10 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 minutes block
  });

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
    
    if (!fullPhone || !phoneValid || !selectedCountry) {
      toast({
        title: "Número inválido",
        description: `Por favor, insira um número de telefone válido para ${selectedCountry?.name || 'o país selecionado'}`,
        variant: "destructive",
      });
      return;
    }

    // Check rate limit
    const { allowed, remainingTime, attemptsLeft } = otpRateLimit.checkLimit();
    if (!allowed) {
      const minutes = Math.ceil((remainingTime || 0) / (1000 * 60));
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${minutes} minutos antes de tentar novamente`,
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPhoneOtp(fullPhone);
      
      // Record attempt after successful send
      otpRateLimit.recordAttempt();
      
      setStep('otp');
      setOtp('');
      setOtpTimer(60);
      toast({
        title: "Código enviado! 📱",
        description: `Código OTP enviado para ${fullPhone}`,
      });
    } catch (error) {
      // Error is handled by the store and useEffect
      // Don't record attempt on server errors
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Prevent multiple simultaneous calls
    if (isVerifying) {
      console.log('Already verifying, ignoring call');
      return;
    }
    
    if (!otp || otp.length !== 6) {
      toast({
        title: "Código incompleto",
        description: "Por favor, insira o código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    // Check rate limit for verification
    const { allowed, remainingTime, attemptsLeft } = verifyRateLimit.checkLimit();
    if (!allowed) {
      const minutes = Math.ceil((remainingTime || 0) / (1000 * 60));
      toast({
        title: "Muitas tentativas de verificação",
        description: `Aguarde ${minutes} minutos antes de tentar novamente`,
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    console.log('Starting OTP verification for:', fullPhone, 'OTP:', otp);

    try {
      const result = await verifyPhoneOtp(fullPhone, otp);
      
      console.log('Verification result:', result);
      
      if (result.success) {
        // Reset rate limits on successful login
        otpRateLimit.reset();
        verifyRateLimit.reset();
        
        toast({
          title: "Login realizado com sucesso! 🎉",
          description: "Bem-vindo de volta ao KIXIKILA",
        });
        // Redirection is now handled by the auth store based on user role
      } else {
        // Record verification attempt only on failure
        verifyRateLimit.recordAttempt();
        console.error('Verification failed:', result.message);
      }
    } catch (error) {
      console.error('Verification error:', error);
      // Record verification attempt on error
      verifyRateLimit.recordAttempt();
      // Error is handled by the store and useEffect
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    // Check rate limit
    const { allowed, remainingTime, attemptsLeft } = otpRateLimit.checkLimit();
    if (!allowed) {
      const minutes = Math.ceil((remainingTime || 0) / (1000 * 60));
      toast({
        title: "Muitas tentativas",
        description: `Aguarde ${minutes} minutos antes de reenviar`,
        variant: "destructive",
      });
      return;
    }

    try {
      await sendPhoneOtp(fullPhone);
      
      // Record attempt after successful send
      otpRateLimit.recordAttempt();
      
      setOtp(''); // Clear previous OTP
      setOtpTimer(60);
      toast({
        title: "Código reenviado! 📱",
        description: `Novo código OTP enviado para ${fullPhone}`,
      });
    } catch (error) {
      // Error is handled by the store and useEffect
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setOtpTimer(0);
    // Reset verification rate limit when going back
    verifyRateLimit.reset();
  };

  const handlePhoneChange = (fullPhoneValue: string, formatted: string, country: Country, isValid: boolean) => {
    setFullPhone(fullPhoneValue);
    setFormattedPhone(formatted);
    setSelectedCountry(country);
    setPhoneValid(isValid);
  };

  const handleOtpComplete = (otpValue: string) => {
    setOtp(otpValue);
    // Auto-verification removed to prevent loops
    // User must manually click verify button
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
                ? 'Entre com seu número de telefone internacional' 
                : `Código enviado para ${fullPhone}`
              }
            </p>
            
            {/* Rate limit warnings */}
            {step === 'phone' && !otpRateLimit.checkLimit().allowed && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">
                  Muitas tentativas. Aguarde {Math.ceil(otpRateLimit.getRemainingTime() / (1000 * 60))} min.
                </p>
              </div>
            )}
            
            {step === 'otp' && !verifyRateLimit.checkLimit().allowed && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-600" />
                <p className="text-sm text-red-700">
                  Muitas tentativas de verificação. Aguarde {Math.ceil(verifyRateLimit.getRemainingTime() / (1000 * 60))} min.
                </p>
              </div>
            )}
          </div>

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Número de telefone internacional
                </label>
                <InternationalPhoneInput
                  value={fullPhone}
                  onChange={handlePhoneChange}
                  autoComplete="tel"
                  disabled={isLoading}
                  defaultCountry="PT"
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full ios-button"
                disabled={isLoading || !phoneValid || !otpRateLimit.checkLimit().allowed}
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
              
              {otpRateLimit.checkLimit().allowed && otpRateLimit.attemptsLeft < 3 && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ {otpRateLimit.attemptsLeft} tentativas restantes
                </p>
              )}
              
              {selectedCountry && (
                <p className="text-xs text-center text-muted-foreground">
                  🌍 País selecionado: {selectedCountry.flag} {selectedCountry.name}
                </p>
              )}

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
                <label className="block text-sm font-medium text-foreground mb-3">
                  Código de verificação
                  <span className="text-xs text-muted-foreground ml-2">
                    (6 dígitos)
                  </span>
                </label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleOtpComplete}
                  disabled={isLoading || !verifyRateLimit.checkLimit().allowed}
                  autoFocus={true}
                />
              </div>

              <Button
                type="submit"
                variant="default"
                size="lg"
                className="w-full ios-button"
                disabled={isLoading || isVerifying || otp.length !== 6 || !verifyRateLimit.checkLimit().allowed}
              >
                {(isLoading || isVerifying) ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Verificar código
                  </>
                )}
              </Button>
              
              {verifyRateLimit.checkLimit().allowed && verifyRateLimit.attemptsLeft < 5 && (
                <p className="text-xs text-amber-600 text-center">
                  ⚠️ {verifyRateLimit.attemptsLeft} tentativas de verificação restantes
                </p>
              )}

              <div className="text-center">
                {otpTimer > 0 ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Reenviar código em {otpTimer}s
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-sm text-primary font-semibold hover:text-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isLoading || !otpRateLimit.checkLimit().allowed}
                  >
                    📱 Reenviar código
                  </button>
                )}
                
                {!otpRateLimit.checkLimit().allowed && otpTimer === 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    Limite de reenvios atingido. Aguarde para tentar novamente.
                  </p>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};