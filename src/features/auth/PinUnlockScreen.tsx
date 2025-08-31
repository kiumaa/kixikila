import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

interface PinUnlockScreenProps {
  onSuccess: () => void;
  onFallbackToOtp: () => void;
  userPhone: string;
  userName?: string;
}

const PinUnlockScreen = ({ onSuccess, onFallbackToOtp, userPhone, userName }: PinUnlockScreenProps) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockTimeRemaining, setLockTimeRemaining] = useState(0);
  const { toast } = useToast();

  // Obter device ID
  const getDeviceId = () => {
    return localStorage.getItem('kixikila_device_id') || crypto.randomUUID();
  };

  // Timer para bloqueio
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockTimeRemaining > 0) {
      interval = setInterval(() => {
        setLockTimeRemaining((prev) => {
          if (prev <= 1) {
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockTimeRemaining]);

  const handlePinInput = (digit: string) => {
    if (pin.length < 4 && lockTimeRemaining === 0) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Auto-submeter quando PIN completo
      if (newPin.length === 4) {
        setTimeout(() => handleSubmit(newPin), 200);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleSubmit = async (pinToVerify = pin) => {
    if (pinToVerify.length !== 4 || lockTimeRemaining > 0) return;

    setIsLoading(true);

    try {
      // Chamar Edge Function para verificar PIN
      const { data, error } = await supabase.functions.invoke('pin-management', {
        body: {
          action: 'verify',
          pin: pinToVerify,
          deviceId: getDeviceId()
        }
      });

      if (error) throw error;

      if (!data.success || !data.valid) {
        // PIN incorreto
        const newFailedAttempts = failedAttempts + 1;
        setFailedAttempts(newFailedAttempts);
        
        if (data.error?.includes('bloqueado')) {
          // Dispositivo bloqueado
          const match = data.error.match(/(\d+) minutos/);
          if (match) {
            setLockTimeRemaining(parseInt(match[1]) * 60);
          }
          toast({
            title: "Dispositivo bloqueado",
            description: data.error,
            variant: "destructive",
          });
        } else if (data.error?.includes('Restam')) {
          // Tentativas restantes
          toast({
            title: "PIN incorreto",
            description: data.error,
            variant: "destructive",
          });
        } else if (newFailedAttempts >= 3) {
          // Forçar OTP após 3 tentativas locais
          toast({
            title: "Muitas tentativas falhadas",
            description: "Por segurança, vais precisar de usar OTP.",
            variant: "destructive",
          });
          setTimeout(() => onFallbackToOtp(), 2000);
          return;
        } else {
          toast({
            title: "PIN incorreto",
            description: `Restam ${3 - newFailedAttempts} tentativas`,
            variant: "destructive",
          });
        }
        
        setPin('');
        return;
      }

      // PIN correto
      toast({
        title: "Bem-vindo de volta!",
        description: "Acesso desbloqueado com sucesso.",
        variant: "default",
      });

      onSuccess();

    } catch (error: any) {
      console.error('Erro ao verificar PIN:', error);
      toast({
        title: "Erro de verificação",
        description: "Ocorreu um erro. Tenta usar OTP.",
        variant: "destructive",
      });
      setTimeout(() => onFallbackToOtp(), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const PinInput = () => (
    <div className="flex gap-4 justify-center mb-8">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
            pin[index] 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border bg-background'
          } ${lockTimeRemaining > 0 ? 'opacity-50' : ''}`}
        >
          {pin[index] ? '●' : ''}
        </div>
      ))}
    </div>
  );

  const NumberPad = () => (
    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
        <Button
          key={number}
          variant="outline"
          size="lg"
          className="h-16 text-xl font-semibold rounded-2xl"
          onClick={() => handlePinInput(number.toString())}
          disabled={isLoading || lockTimeRemaining > 0}
        >
          {number}
        </Button>
      ))}
      <div></div>
      <Button
        variant="outline"
        size="lg"
        className="h-16 text-xl font-semibold rounded-2xl"
        onClick={() => handlePinInput('0')}
        disabled={isLoading || lockTimeRemaining > 0}
      >
        0
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="h-16 rounded-2xl"
        onClick={handleBackspace}
        disabled={isLoading || lockTimeRemaining > 0}
      >
        ⌫
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md p-6 text-center mb-8">
        {/* Cabeçalho com informação do utilizador */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">
              {userName ? userName.split(' ').map(n => n[0]).join('').slice(0, 2) : '👤'}
            </span>
          </div>
          <h2 className="font-semibold text-lg">Olá, {userName?.split(' ')[0] || 'utilizador'}!</h2>
          <p className="text-sm text-muted-foreground">{userPhone}</p>
        </div>

        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        
        <h3 className="text-lg font-semibold mb-2">Insere o teu PIN</h3>
        
        <p className="text-sm text-muted-foreground mb-6">
          {lockTimeRemaining > 0 
            ? `Dispositivo bloqueado. Tenta novamente em ${formatTime(lockTimeRemaining)}`
            : 'Usa o PIN de 4 dígitos para desbloqueares rapidamente'
          }
        </p>

        {lockTimeRemaining > 0 ? (
          <div className="flex items-center justify-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="font-mono text-lg text-destructive">
              {formatTime(lockTimeRemaining)}
            </span>
          </div>
        ) : (
          <PinInput />
        )}
      </Card>

      {lockTimeRemaining === 0 && (
        <NumberPad />
      )}

      <div className="mt-8 space-y-3 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFallbackToOtp}
          className="text-muted-foreground"
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Usar código SMS
        </Button>

        {failedAttempts > 0 && (
          <p className="text-xs text-muted-foreground">
            Tentativas falhadas: {failedAttempts}/5
          </p>
        )}
      </div>

      {isLoading && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Verificando PIN...
          </div>
        </div>
      )}
    </div>
  );
};

export default PinUnlockScreen;