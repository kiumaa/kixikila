import React, { useState } from 'react';
import { ArrowLeft, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PinSetupScreenProps {
  onBack: () => void;
  onComplete: () => void;
  userPhone: string;
  rememberDevice?: boolean;
}

const PinSetupScreen = ({ onBack, onComplete, userPhone, rememberDevice = true }: PinSetupScreenProps) => {
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Gerar device ID único
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('kixikila_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('kixikila_device_id', deviceId);
    }
    return deviceId;
  };

  const handlePinInput = (digit: string, isConfirm = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;
    
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      setCurrentPin(newPin);
      
      // Auto-avançar para confirmação quando PIN setup está completo
      if (!isConfirm && newPin.length === 4) {
        setTimeout(() => setStep('confirm'), 300);
      }
      
      // Auto-submeter quando confirmação completa
      if (isConfirm && newPin.length === 4) {
        // Usar valores calculados em vez dos estados para evitar timing issues
        setTimeout(() => handleSubmitWithValues(pin, newPin), 300);
      }
    }
  };

  const handleBackspace = (isConfirm = false) => {
    const currentPin = isConfirm ? confirmPin : pin;
    const setCurrentPin = isConfirm ? setConfirmPin : setPin;
    
    if (currentPin.length > 0) {
      setCurrentPin(currentPin.slice(0, -1));
    } else if (isConfirm) {
      setStep('setup');
    }
  };

  const handleSubmitWithValues = async (setupPin: string, confirmationPin: string) => {
    console.log('PIN Debug:', { setupPin, confirmationPin }); // Debug log
    
    if (setupPin !== confirmationPin) {
      toast({
        title: "PINs não coincidem",
        description: "Os PINs inseridos são diferentes. Tenta novamente.",
        variant: "destructive",
      });
      setPin('');
      setConfirmPin('');
      setStep('setup');
      return;
    }

    if (setupPin.length !== 4) {
      toast({
        title: "PIN incompleto",
        description: "O PIN deve ter exatamente 4 dígitos.",
        variant: "destructive",
      });
      return;
    }

    await performPinSetup(setupPin);
  };

  const handleSubmit = async () => {
    await handleSubmitWithValues(pin, confirmPin);
  };

  const performPinSetup = async (pinValue: string) => {
    setIsLoading(true);

    try {
      // Get custom session or Supabase session
      const customSession = localStorage.getItem('kixikila_custom_session');
      const customUserId = localStorage.getItem('kixikila_user_id');
      
      let headers: Record<string, string> = {};
      
      if (customSession && customUserId) {
        // Use custom authentication headers
        headers['x-kixikila-user-id'] = customUserId;
        console.log('Using custom authentication for PIN setup');
      } else {
        // Fallback to Supabase auth if available
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('Utilizador não está autenticado');
        }
        
        headers['Authorization'] = `Bearer ${session.access_token}`;
        console.log('Using Supabase authentication for PIN setup');
      }

      // Call Edge Function to set PIN
      const { data, error } = await supabase.functions.invoke('pin-management', {
        body: {
          action: 'set',
          pin: pinValue,
          deviceId: rememberDevice ? getDeviceId() : null,
          deviceName: `${navigator.userAgent.split(' ')[0]} - ${new Date().toLocaleDateString('pt-PT')}`
        },
        headers
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao definir PIN');
      }

      toast({
        title: "PIN definido com sucesso!",
        description: rememberDevice 
          ? "O teu dispositivo foi marcado como confiável por 30 dias."
          : "PIN configurado. Podes usá-lo para entrar rapidamente.",
        variant: "default",
      });

      onComplete();

    } catch (error: any) {
      console.error('Erro ao definir PIN:', error);
      toast({
        title: "Erro ao definir PIN",
        description: error.message || "Ocorreu um erro. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const PinInput = ({ value, isConfirm = false }: { value: string; isConfirm?: boolean }) => (
    <div className="flex gap-4 justify-center mb-8">
      {[0, 1, 2, 3].map((index) => (
        <div
          key={index}
          className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200 ${
            value[index] 
              ? 'border-primary bg-primary/10 text-primary' 
              : 'border-border bg-background'
          }`}
        >
          {value[index] ? '●' : ''}
        </div>
      ))}
    </div>
  );

  const NumberPad = ({ isConfirm = false }) => (
    <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
        <Button
          key={number}
          variant="outline"
          size="lg"
          className="h-16 text-xl font-semibold rounded-2xl"
          onClick={() => handlePinInput(number.toString(), isConfirm)}
          disabled={isLoading}
        >
          {number}
        </Button>
      ))}
      <div></div>
      <Button
        variant="outline"
        size="lg"
        className="h-16 text-xl font-semibold rounded-2xl"
        onClick={() => handlePinInput('0', isConfirm)}
        disabled={isLoading}
      >
        0
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="h-16 rounded-2xl"
        onClick={() => handleBackspace(isConfirm)}
        disabled={isLoading}
      >
        ⌫
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-6 pb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">
            {step === 'setup' ? 'Criar PIN' : 'Confirmar PIN'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Passo final para proteger a tua conta
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {step === 'setup' ? (
              <Shield className="w-8 h-8 text-primary" />
            ) : (
              <Check className="w-8 h-8 text-primary" />
            )}
          </div>
          
          <h2 className="text-lg font-semibold mb-2">
            {step === 'setup' ? 'Define o teu PIN' : 'Confirma o PIN'}
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6">
            {step === 'setup' 
              ? 'Cria um PIN de 4 dígitos para acesso rápido'
              : 'Insere novamente o PIN para confirmação'
            }
          </p>

          <PinInput 
            value={step === 'setup' ? pin : confirmPin} 
            isConfirm={step === 'confirm'} 
          />
        </Card>

        <NumberPad isConfirm={step === 'confirm'} />

        {rememberDevice && (
          <div className="mt-8 p-4 bg-primary/5 rounded-xl max-w-md">
            <p className="text-xs text-center text-muted-foreground">
              🛡️ Este dispositivo será marcado como confiável por 30 dias. 
              Poderás entrar apenas com o PIN.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Configurando PIN...
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PinSetupScreen;