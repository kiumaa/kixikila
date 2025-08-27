import React, { useState } from 'react';
import { CreditCard, Wallet, Euro, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/design-system/Modal';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useToast } from '@/hooks/use-toast';
import { type Group, formatCurrency } from '@/data/mockData';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentBalance: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  group,
  currentBalance
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  const [step, setStep] = useState<'method' | 'processing' | 'success'>('method');
  const { toast } = useToast();

  const hasEnoughBalance = currentBalance >= group.contributionAmount;
  
  const handlePayment = () => {
    setStep('processing');
    
    // Simulate payment processing
    setTimeout(() => {
      setStep('success');
      
      setTimeout(() => {
        setStep('method');
        onClose();
        
        toast({
          title: "✅ Pagamento realizado!",
          description: `Contribuição de ${formatCurrency(group.contributionAmount)} para ${group.name}`
        });
      }, 2000);
    }, 2500);
  };

  const handleClose = () => {
    if (step !== 'processing') {
      setStep('method');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={step === 'method' ? 'Efetuar Pagamento' : ''}
      size="md"
    >
      {step === 'method' && (
        <div className="space-y-6">
          <Card className="ios-card bg-gradient-to-r from-primary-subtle to-primary-subtle/50 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-semibold font-system text-foreground mb-2">
                {group.name}
              </h3>
              <div className="text-3xl font-bold font-system text-primary mb-2">
                {formatCurrency(group.contributionAmount)}
              </div>
              <p className="text-sm text-muted-foreground">
                Contribuição mensal • Ciclo {group.cycle}
              </p>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h4 className="font-medium text-foreground">Método de pagamento</h4>
            
            {/* Wallet Payment */}
            <Card
              className={`cursor-pointer ios-card transition-all ${
                paymentMethod === 'wallet'
                  ? 'ring-2 ring-primary bg-primary-subtle/20'
                  : 'hover:bg-muted/50'
              } ${!hasEnoughBalance ? 'opacity-50' : ''}`}
              onClick={() => hasEnoughBalance && setPaymentMethod('wallet')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-subtle rounded-xl flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium font-system text-foreground">
                        Carteira KIXIKILA
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Saldo: {formatCurrency(currentBalance)}
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'wallet' && hasEnoughBalance && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {!hasEnoughBalance && (
              <Card className="ios-card bg-destructive-subtle/20 border-destructive/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-destructive mb-1">
                        Saldo insuficiente
                      </p>
                      <p className="text-destructive/80 text-xs">
                        Precisa de {formatCurrency(group.contributionAmount - currentBalance)} a mais. 
                        Deposite fundos primeiro.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card Payment */}
            <Card
              className={`cursor-pointer ios-card transition-all ${
                paymentMethod === 'card'
                  ? 'ring-2 ring-primary bg-primary-subtle/20'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-success-subtle rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium font-system text-foreground">
                        Cartão de Crédito/Débito
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Via Stripe • Processamento seguro
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {paymentMethod === 'wallet' && hasEnoughBalance && (
            <Card className="ios-card bg-success-subtle/20 border-success/20">
              <CardContent className="p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  Saldo após pagamento
                </div>
                <div className="text-xl font-bold font-system text-success">
                  {formatCurrency(currentBalance - group.contributionAmount)}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handlePayment}
            disabled={paymentMethod === 'wallet' && !hasEnoughBalance}
            className="w-full ios-button bg-primary hover:bg-primary-hover text-primary-foreground font-semibold"
            size="lg"
          >
            {paymentMethod === 'wallet' ? (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Pagar com Carteira
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Pagar com Cartão
              </>
            )}
          </Button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-center py-8 space-y-6">
          <LoadingSpinner size="lg" className="mx-auto" />
          <div>
            <h3 className="text-lg font-semibold font-system text-foreground mb-2">
              A processar pagamento...
            </h3>
            <p className="text-muted-foreground">
              {paymentMethod === 'wallet' 
                ? 'A debitar da carteira KIXIKILA'
                : 'Stripe está a processar o pagamento'
              }
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
              Pagamento Confirmado!
            </h3>
            <p className="text-muted-foreground">
              A sua contribuição foi registrada com sucesso
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
};