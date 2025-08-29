import React, { useState } from 'react';
import { CreditCard, Euro, Shield, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { useStripeIntegration } from '@/hooks/useStripeIntegration';
import { formatCurrency } from '@/data/mockData';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currentBalance
}) => {
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
  const { toast } = useToast();
  const { createPayment, loading } = useStripeIntegration();

  const quickAmounts = [50, 100, 250, 500];

  const handleDeposit = async () => {
    if (!amount || parseFloat(amount) < 10) return;
    
    setStep('processing');
    
    try {
      await createPayment({
        amount: parseFloat(amount),
        description: 'Depósito na carteira KIXIKILA'
      });
      
      // Payment successful, show success step
      setStep('success');
      
      setTimeout(() => {
        setStep('amount');
        setAmount('');
        onClose();
        
        toast({
          title: "✅ Depósito realizado!",
          description: `${formatCurrency(parseFloat(amount))} foi adicionado à sua carteira`
        });
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setStep('amount');
      
      toast({
        title: "❌ Erro no depósito",
        description: "Ocorreu um erro ao processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('amount');
      setAmount('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'amount' ? 'Depositar Fundos' : ''}
      size="md"
    >
      {step === 'amount' && (
        <div className="space-y-6">
          <Card className="ios-card bg-gradient-to-r from-primary-subtle to-primary-subtle/50 border-primary/20">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Saldo atual
              </div>
              <div className="text-2xl font-bold font-system text-foreground">
                {formatCurrency(currentBalance)}
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-foreground">
              Valor a depositar
            </Label>
            <div className="relative mt-2">
              <Euro className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="ios-input pl-12 text-xl font-semibold"
                min="10"
                max="5000"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mínimo: {formatCurrency(10)} • Máximo: {formatCurrency(5000)}
            </p>
          </div>

          <div>
            <Label className="text-sm font-medium text-foreground mb-3 block">
              Valores rápidos
            </Label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map(value => (
                <Button
                  key={value}
                  type="button"
                  onClick={() => setAmount(value.toString())}
                  variant={amount === value.toString() ? 'default' : 'outline'}
                  className="ios-button font-semibold"
                  size="sm"
                >
                  {formatCurrency(value)}
                </Button>
              ))}
            </div>
          </div>

          <Card className="ios-card bg-muted/30 border-muted">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    Pagamento 100% seguro
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Processado via Stripe com tecnologia bancária. 
                    Os seus dados estão protegidos com encriptação de nível militar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {amount && parseFloat(amount) >= 10 && (
            <Card className="ios-card bg-success-subtle/20 border-success/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Novo saldo após depósito
                </div>
                <div className="text-xl font-bold font-system text-success">
                  {formatCurrency(currentBalance + parseFloat(amount))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleDeposit}
            disabled={!amount || parseFloat(amount) < 10}
            className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
            size="lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            Depositar {amount ? formatCurrency(parseFloat(amount)) : formatCurrency(0)}
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8 space-y-6">
          <LoadingSpinner size="lg" className="mx-auto" />
          <div>
            <h3 className="text-lg font-semibold font-system text-foreground mb-2">
              A processar depósito...
            </h3>
            <p className="text-muted-foreground">
              Stripe está a validar o pagamento
            </p>
          </div>
        </div>
      )}

      {step === 'success' && (
        <div className="text-center py-8 space-y-6">
          <div className="w-16 h-16 bg-success-subtle rounded-full flex items-center justify-center mx-auto animate-bounce-in">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div>
            <h3 className="text-lg font-semibold font-system text-foreground mb-2">
              Depósito Confirmado!
            </h3>
            <p className="text-muted-foreground">
              O valor foi adicionado à sua carteira
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};