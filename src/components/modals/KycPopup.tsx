import React, { useState } from 'react';
import { Shield, FileText, Clock, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useKycProcess } from '@/hooks/useKycProcess';
import KycWizard from '@/components/kyc/KycWizard';
import KycStatusScreen from '@/components/kyc/KycStatusScreen';

interface KycPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartKyc: () => void;
}

const KycPopup = ({ isOpen, onClose, onStartKyc }: KycPopupProps) => {
  const [isSkipping, setIsSkipping] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const { toast } = useToast();
  const { kycData } = useKycProcess();

  const handleSkip = async () => {
    setIsSkipping(true);
    
    // Simulate skip action
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Tudo bem!",
      description: "Podes fazer a verificação mais tarde no teu perfil.",
      variant: "default",
    });

    setIsSkipping(false);
    onClose();
  };

  const handleStartKyc = () => {
    setShowWizard(true);
    onStartKyc();
  };

  const handleWizardComplete = () => {
    setShowWizard(false);
    setShowStatus(true);
  };

  const handleStatusBack = () => {
    setShowStatus(false);
    onClose();
  };

  // Show KYC Wizard
  if (showWizard) {
    return <KycWizard onClose={onClose} onComplete={handleWizardComplete} />;
  }

  // Show Status Screen
  if (showStatus) {
    return <KycStatusScreen onBack={handleStatusBack} onRetry={() => setShowWizard(true)} />;
  }

  // Check if user has existing KYC data
  if (kycData.status !== 'not_started') {
    return <KycStatusScreen onBack={onClose} onRetry={() => setShowWizard(true)} />;
  }

  const benefits = [
    {
      icon: Shield,
      title: "Conta Segura",
      description: "Protege a tua conta e aumenta a confiança"
    },
    {
      icon: CheckCircle,
      title: "Limites Maiores",
      description: "Acesso a valores mais elevados e grupos premium"
    },
    {
      icon: Clock,
      title: "Rápido e Fácil",
      description: "Menos de 2 minutos para completar"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Verificação de Identidade</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              disabled={isSkipping}
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ícone principal */}
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Bem-vindo à KIXIKILA!</h2>
            <p className="text-muted-foreground text-sm">
              Para garantir a segurança de todos, precisamos de verificar a tua identidade.
            </p>
          </div>

          {/* Benefícios */}
          <div className="space-y-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{benefit.title}</h3>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Processo */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold text-sm mb-2">O que vais precisar:</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Cartão de Cidadão ou Passaporte</li>
              <li>• Foto clara do documento</li>
              <li>• 2 minutos do teu tempo</li>
            </ul>
          </Card>

          {/* Ações */}
          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleStartKyc}
              disabled={isSkipping}
            >
              <Shield className="w-4 h-4 mr-2" />
              Começar Verificação
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={handleSkip}
              disabled={isSkipping}
            >
              {isSkipping ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  A guardar...
                </div>
              ) : (
                'Fazer mais tarde'
              )}
            </Button>
          </div>

          {/* Nota de segurança */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              🔒 Os teus dados são protegidos e nunca partilhados com terceiros.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KycPopup;