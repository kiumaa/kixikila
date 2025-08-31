import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, ArrowLeft } from 'lucide-react';

interface PinLoginComponentProps {
  onVerifyPin: (pin: string) => void;
  onFallbackToOtp: () => void;
  isLoading?: boolean;
  userName?: string;
}

const PinLoginComponent: React.FC<PinLoginComponentProps> = ({
  onVerifyPin,
  onFallbackToOtp,
  isLoading = false,
  userName
}) => {
  const [pin, setPin] = useState('');

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        setTimeout(() => onVerifyPin(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
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
          }`}
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
        onClick={() => handlePinInput('0')}
        disabled={isLoading}
      >
        0
      </Button>
      <Button
        variant="ghost"
        size="lg"
        className="h-16 rounded-2xl"
        onClick={handleBackspace}
        disabled={isLoading}
      >
        ⌫
      </Button>
    </div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="p-6 text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        
        <h2 className="text-lg font-semibold mb-2">
          Bem-vindo de volta{userName ? `, ${userName}` : ''}!
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6">
          Insere o teu PIN para continuar
        </p>

        <PinInput />
      </Card>

      <NumberPad />

      <div className="mt-8 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onFallbackToOtp}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Usar código SMS
        </Button>
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

export default PinLoginComponent;