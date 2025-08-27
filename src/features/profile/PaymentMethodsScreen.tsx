import React, { useState } from 'react';
import { ArrowLeft, CreditCard, Plus, Trash2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethodsScreenProps {
  onBack: () => void;
}

export const PaymentMethodsScreen: React.FC<PaymentMethodsScreenProps> = ({
  onBack
}) => {
  const [paymentMethods] = useState([
    {
      id: 1,
      type: 'card',
      name: 'Visa •••• 1234',
      expiry: '12/26',
      isDefault: true,
      status: 'active'
    },
    {
      id: 2,
      type: 'bank',
      name: 'Conta Millennium BCP',
      iban: 'PT50 0033 ••••',
      isDefault: false,
      status: 'active'
    }
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const handleAddCard = async () => {
    setIsAdding(true);
    // Simulate adding card
    setTimeout(() => {
      setIsAdding(false);
      setShowAddCard(false);
      setNewCard({ number: '', expiry: '', cvv: '', name: '' });
      toast({
        title: "Cartão adicionado",
        description: "O seu método de pagamento foi adicionado com sucesso."
      });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Métodos de Pagamento
          </h1>
        </div>

        {/* Status Card */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              Gerir Pagamentos
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Adicione ou remova métodos de pagamento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Add New Method */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <Button
              onClick={() => setShowAddCard(true)}
              className="w-full ios-button justify-center"
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Método de Pagamento
            </Button>
          </CardContent>
        </Card>

        {/* Add Card Form */}
        {showAddCard && (
          <Card className="ios-card">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-system text-foreground">
                  Adicionar Cartão
                </h3>
                <Button
                  onClick={() => setShowAddCard(false)}
                  variant="outline"
                  size="sm"
                  className="ios-button"
                >
                  Cancelar
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Número do Cartão
                </label>
                <Input
                  value={newCard.number}
                  onChange={(e) => setNewCard({...newCard, number: e.target.value})}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium font-system text-foreground mb-2">
                    Validade
                  </label>
                  <Input
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({...newCard, expiry: e.target.value})}
                    placeholder="MM/AA"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium font-system text-foreground mb-2">
                    CVV
                  </label>
                  <Input
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({...newCard, cvv: e.target.value})}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium font-system text-foreground mb-2">
                  Nome no Cartão
                </label>
                <Input
                  value={newCard.name}
                  onChange={(e) => setNewCard({...newCard, name: e.target.value})}
                  placeholder="Nome como aparece no cartão"
                />
              </div>

              <Button
                onClick={handleAddCard}
                disabled={isAdding || !newCard.number || !newCard.expiry || !newCard.cvv || !newCard.name}
                className="w-full ios-button"
              >
                {isAdding ? 'A adicionar...' : 'Adicionar Cartão'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods List */}
        <div className="space-y-4">
          <h3 className="font-semibold font-system text-foreground">
            Métodos Ativos
          </h3>
          
          {paymentMethods.map((method) => (
            <Card key={method.id} className="ios-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold font-system text-foreground">
                        {method.name}
                      </div>
                      {method.type === 'card' && (
                        <div className="text-sm text-muted-foreground font-system">
                          Expira em {method.expiry}
                        </div>
                      )}
                      {method.type === 'bank' && (
                        <div className="text-sm text-muted-foreground font-system">
                          {method.iban}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {method.isDefault && (
                      <StatusBadge status="success" size="xs">
                        Padrão
                      </StatusBadge>
                    )}
                    <StatusBadge status="paid" size="xs">
                      Ativo
                    </StatusBadge>
                  </div>
                </div>

                <div className="flex gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 ios-button"
                    >
                      Definir como Padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="ios-button text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security Info */}
        <Card className="ios-card bg-gradient-to-r from-info-subtle to-info-subtle/50 border-info/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-info" />
              </div>
              <div>
                <h3 className="font-semibold font-system text-info mb-2">
                  Segurança dos Pagamentos
                </h3>
                <ul className="text-sm text-info/80 space-y-1 font-system">
                  <li>• Dados encriptados com SSL/TLS</li>
                  <li>• Processamento via Stripe (PCI DSS)</li>
                  <li>• Não armazenamos dados completos do cartão</li>
                  <li>• Autenticação 3D Secure quando necessária</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};