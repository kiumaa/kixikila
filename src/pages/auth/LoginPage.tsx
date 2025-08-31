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
import { useTrustedDevice } from '@/hooks/useTrustedDevice';
import { usePinManagement } from '@/hooks/usePinManagement';
import PinLoginScreen from '@/components/auth/PinLoginScreen';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    sendOTP, 
    verifyOTP, 
    isLoading, 
    error, 
    clearError,
    isAuthenticated,
    user,
    verifyPinLogin,
    createTrustedSession 
  } = useMockAuthStore();

  const { 
    isTrustedDevice,
    incrementFailedAttempts,
    resetFailedAttempts,
    isDeviceLocked,
    getFailedAttempts,
    clearDeviceSession,
    createDeviceSession 
  } = useTrustedDevice();

  const { hasPinConfigured } = usePinManagement();

  const [step, setStep] = useState<'check_device' | 'pin' | 'phone' | 'otp'>('check_device');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);
  const [lockTimer, setLockTimer] = useState(0);

  // Initial device check and redirect logic
  useEffect(() => {
    if (isAuthenticated && user) {
      // Check if user has PIN configured and device is trusted
      const hasPin = hasPinConfigured(user.id);
      const isTrusted = isTrustedDevice(user.id);
      
      if (hasPin && isTrusted) {
        // Go directly to /home for trusted devices
        navigate('/home');
        return;
      } else if (hasPin) {
        // Has PIN but not trusted device, redirect to set-pin
        navigate('/auth/set-pin');
        return;
      } else {
        // No PIN configured, redirect to set-pin
        navigate('/auth/set-pin');
        return;
      }
    }

    // Check for trusted device session
    const storedUser = localStorage.getItem('mock-auth-storage');
    if (storedUser) {
      try {
        const parsedData = JSON.parse(storedUser);
        if (parsedData.state?.user) {
          const userId = parsedData.state.user.id;
          const hasPin = hasPinConfigured(userId);
          const isTrusted = isTrustedDevice(userId);
          const isLocked = isDeviceLocked(userId);
          
          if (hasPin && isTrusted && !isLocked) {
            setStep('pin');
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing stored auth data:', error);
      }
    }
    
    // Default to phone step
    setStep('phone');
  }, [isAuthenticated, navigate, user, hasPinConfigured, isTrustedDevice, isDeviceLocked]);

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

  // Timer for device lock
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockTimer]);

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
    
    if (result.success && result.user) {
      // Create trusted device session after successful OTP login
      const deviceId = createDeviceSession(result.user.id);
      createTrustedSession(result.user.id, deviceId);
      
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

  // PIN Login Handlers
  const handlePinSuccess = () => {
    if (user) {
      resetFailedAttempts(user.id);
      navigate('/home');
    }
  };

  const handlePinFailure = () => {
    if (user) {
      const attempts = incrementFailedAttempts(user.id);
      
      if (attempts >= 5) {
        // Device is locked, clear session and force SMS
        clearDeviceSession(user.id);
        setStep('phone');
        setLockTimer(300); // 5 minutes in seconds
        
        toast({
          title: "Dispositivo bloqueado 🔒",
          description: "Muitas tentativas inválidas. Use SMS para entrar.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUseSMS = () => {
    if (user) {
      clearDeviceSession(user.id);
    }
    setStep('phone');
  };

  const handleBackFromPin = () => {
    setStep('phone');
  };

  // Get stored user for PIN screen
  const getStoredUser = () => {
    try {
      const storedUser = localStorage.getItem('mock-auth-storage');
      if (storedUser) {
        const parsedData = JSON.parse(storedUser);
        return parsedData.state?.user || null;
      }
    } catch (error) {
      console.error('Error getting stored user:', error);
    }
    return null;
  };

  // Render PIN screen for trusted devices
  if (step === 'pin') {
    const storedUser = getStoredUser();
    if (!storedUser) {
      // No user found, redirect to phone
      setStep('phone');
      return null;
    }

    const failedAttempts = getFailedAttempts(storedUser.id);
    const isLocked = isDeviceLocked(storedUser.id);

    return (
      <PinLoginScreen
        user={storedUser}
        onPinSuccess={handlePinSuccess}
        onUseSMS={handleUseSMS}
        onBack={handleBackFromPin}
        failedAttempts={failedAttempts}
        isLocked={isLocked}
        lockTimeRemaining={lockTimer > 0 ? lockTimer : undefined}
      />
    );
  }

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