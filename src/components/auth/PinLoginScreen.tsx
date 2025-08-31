import React, { useState } from 'react';
import { ArrowLeft, Smartphone, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PinDisplay } from '@/components/ui/pin-display';
import { NumericKeypad } from '@/components/ui/numeric-keypad';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PinLoginScreenProps {
  user: {
    id: string;
    name?: string;
    phone: string;
  };
  onPinSuccess: () => void;
  onUseSMS: () => void;
  onBack: () => void;
  failedAttempts: number;
  isLocked: boolean;
  lockTimeRemaining?: number;
}

const PinLoginScreen: React.FC<PinLoginScreenProps> = ({
  user,
  onPinSuccess,
  onUseSMS,
  onBack,
  failedAttempts,
  isLocked,
  lockTimeRemaining
}) => {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const remainingAttempts = Math.max(0, 5 - failedAttempts);

  const handleKeyPress = (key: string) => {
    if (isLoading || isLocked || pin.length >= 4) return;
    setPin(prev => prev + key);
  };

  const handleDelete = () => {
    if (isLoading || isLocked) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handlePinComplete = async () => {
    if (pin.length !== 4 || isLoading || isLocked) return;

    setIsLoading(true);

    try {
      // Simulate PIN verification delay
      await new Promise(resolve => setTimeout(resolve, 300));

      // For demo, accept "1234" as valid PIN
      if (pin === '1234') {
        onPinSuccess();
        toast({
          title: "Acesso liberado! 🎉",
          description: "PIN verificado com sucesso",
        });
      } else {
        // Invalid PIN
        setPin('');
        toast({
          title: "PIN incorreto",
          description: `${remainingAttempts - 1} tentativas restantes`,
          variant: "destructive",
        });
        
        // This will be handled by parent component
        setTimeout(() => {
          if (remainingAttempts <= 1) {
            toast({
              title: "Dispositivo bloqueado 🔒",
              description: "Muitas tentativas inválidas. Use SMS para entrar.",
              variant: "destructive",
            });
          }
        }, 500);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao verificar PIN. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-submit when PIN is complete
  React.useEffect(() => {
    if (pin.length === 4 && !isLocked) {
      handlePinComplete();
    }
  }, [pin, isLocked]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getUserInitials = (name?: string, phone?: string): string => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return phone ? phone.slice(-2) : '??';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent flex items-center justify-center p-6">
      <Card className="w-full max-w-md ios-card animate-fade-in">
        <CardContent className="p-8">
          {!isLocked && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          )}

          <div className="text-center mb-8">
            {/* User Avatar */}
            <div className="mb-6">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center text-lg font-bold text-primary-foreground">
                  {getUserInitials(user.name, user.phone)}
                </div>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {user.name || 'Utilizador'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {user.phone}
                </p>
              </div>
            </div>

            {isLocked ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-destructive/10 rounded-3xl flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-2xl font-bold text-destructive mb-2">
                  Dispositivo Bloqueado
                </h1>
                <p className="text-muted-foreground mb-4">
                  Muitas tentativas inválidas.
                </p>
                {lockTimeRemaining && (
                  <div className="bg-destructive/10 rounded-lg p-3 mb-6">
                    <p className="text-sm text-destructive">
                      Tente novamente em: <strong>{formatTime(lockTimeRemaining)}</strong>
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold font-system text-foreground mb-2">
                  Digite seu PIN
                </h1>
                <p className="text-muted-foreground mb-2">
                  Entre com seu PIN de 4 dígitos
                </p>
                {failedAttempts > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {remainingAttempts} tentativas restantes
                  </Badge>
                )}
              </>
            )}
          </div>

          {!isLocked ? (
            <>
              {/* PIN Display */}
              <div className="mb-8">
                <PinDisplay 
                  value={pin} 
                  length={4} 
                  className="mb-6"
                  showValues={false}
                />
              </div>

              {/* Numeric Keypad */}
              <div className="mb-8">
                <NumericKeypad
                  onKeyPress={handleKeyPress}
                  onDelete={handleDelete}
                  disabled={isLoading}
                />
              </div>
            </>
          ) : null}

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={onUseSMS}
              variant="default"
              size="lg"
              className="w-full"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              {isLocked ? 'Entrar com SMS' : 'Usar SMS em vez do PIN'}
            </Button>

            {isLocked && (
              <p className="text-xs text-center text-muted-foreground">
                💡 Dica: PIN para teste é <strong>1234</strong>
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinLoginScreen;