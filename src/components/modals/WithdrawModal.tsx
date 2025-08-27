import React, { useState } from 'react';
import { Banknote, Euro, AlertTriangle, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/data/mockData';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  currentBalance
}) => {
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('PT50 0002 0123 1234 5678 9015 4');
  const [step, setStep] = useState<'amount' | 'processing' | 'success'>('amount');
  const { toast } = useToast();

  const maxWithdraw = Math.min(currentBalance, 2000);
  const minWithdraw = 20;

  const handleWithdraw = () => {
    if (!amount || parseFloat(amount) < minWithdraw || parseFloat(amount) > maxWithdraw) return;
    
    setStep('processing');
    
    // Simulate bank transfer processing
    setTimeout(() => {
      setStep('success');
      
      setTimeout(() => {
        setStep('amount');
        setAmount('');
        onClose();
        
        toast({
          title: "✅ Levantamento solicitado!",
          description: `${formatCurrency(parseFloat(amount))} será transferido em 1-2 dias úteis`
        });
      }, 3000);
    }, 2000);
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('amount');
      setAmount('');
      onClose();
    }
  };

  const isAmountValid = amount && 
    parseFloat(amount) >= minWithdraw && 
    parseFloat(amount) <= maxWithdraw;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'amount' ? 'Levantar Fundos' : ''}
      size="md"
    >
      {step === 'amount' && (
        <div className="space-y-6">
          <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Saldo disponível
              </div>
              <div className="text-2xl font-bold font-system text-foreground">
                {formatCurrency(currentBalance)}
              </div>
            </CardContent>
          </Card>

          <div>
            <Label htmlFor="amount" className="text-sm font-medium text-foreground">
              Valor a levantar
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
                min={minWithdraw}
                max={maxWithdraw}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Mínimo: {formatCurrency(minWithdraw)} • Máximo: {formatCurrency(maxWithdraw)}
            </p>
          </div>

          <div>
            <Label htmlFor="iban" className="text-sm font-medium text-foreground">
              Conta bancária (IBAN)
            </Label>
            <Input
              id="iban"
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="PT50 0000 0000 0000 0000 0000 0"
              className="ios-input mt-2 font-mono"
            />
          </div>

          <Card className="ios-card bg-info-subtle/20 border-info/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">
                    Tempo de processamento
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Os levantamentos são processados em 1-2 dias úteis. 
                    Receberá uma notificação quando a transferência for concluída.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {amount && parseFloat(amount) > currentBalance && (
            <Card className="ios-card bg-destructive-subtle/20 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-destructive mb-1">
                      Saldo insuficiente
                    </p>
                    <p className="text-destructive/80 text-xs">
                      O valor solicitado excede o seu saldo disponível.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {isAmountValid && (
            <Card className="ios-card bg-success-subtle/20 border-success/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Saldo após levantamento
                </div>
                <div className="text-xl font-bold font-system text-success">
                  {formatCurrency(currentBalance - parseFloat(amount))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleWithdraw}
            disabled={!isAmountValid || !iban.trim()}
            className="w-full ios-button bg-warning hover:bg-warning/90 text-warning-foreground font-semibold"
            size="lg"
          >
            <Banknote className="w-5 h-5 mr-2" />
            Solicitar Levantamento
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8 space-y-6">
          <LoadingSpinner size="lg" className="mx-auto" />
          <div>
            <h3 className="text-lg font-semibold font-system text-foreground mb-2">
              A processar levantamento...
            </h3>
            <p className="text-muted-foreground">
              A validar dados bancários
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
              Levantamento Solicitado!
            </h3>
            <p className="text-muted-foreground">
              O valor será transferido em 1-2 dias úteis
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};