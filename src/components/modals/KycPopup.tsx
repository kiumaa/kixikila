import React, { useState } from 'react';
import { Shield, FileText, Clock, X, CheckCircle, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { KycWizard } from './KycWizard';

interface KycPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onStartKyc: () => void;
}

const KycPopup = ({ isOpen, onClose, onStartKyc }: KycPopupProps) => {
  const [isSkipping, setIsSkipping] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [kycCompleted, setKycCompleted] = useState(false);
  const { toast } = useToast();

  const handleSkip = async () => {
    setIsSkipping(true);

    try {
      const { data, error } = await supabase.functions.invoke('kyc-management', {
        body: {
          action: 'skip'
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Erro ao marcar KYC');
      }

      toast({
        title: "KYC adiado",
        description: "Podes fazer a verificação mais tarde nas definições",
        variant: "default",
      });

      onClose();
    } catch (error: any) {
      console.error('Erro ao skip KYC:', error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tenta novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSkipping(false);
    }
  };

  const handleStartKycWizard = () => {
    setShowWizard(true);
  };

  const handleKycComplete = () => {
    setKycCompleted(true);
    setShowWizard(false);
    
    toast({
      title: "🎉 Verificação concluída!",
      description: "A tua identidade foi verificada com sucesso",
      variant: "default",
    });

    // Auto-close after 3 seconds showing success
    setTimeout(() => {
      onStartKyc();
    }, 3000);
  };

  if (kycCompleted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            
            <div className="mb-4">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-2xl font-bold text-green-900 mb-2">Verificação Aprovada!</h2>
              <p className="text-green-700">A tua identidade foi verificada com sucesso</p>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <Star className="w-4 h-4" />
                <span>Conta totalmente verificada</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                <Shield className="w-4 h-4" />
                <span>Límites máximos desbloqueados</span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground">
              Redirecionando para o dashboard...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen && !showWizard} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Verificação de Identidade
              </span>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Bem-vindo ao KIXIKILA!</h2>
              <p className="text-muted-foreground text-sm">
                Para garantir a segurança da plataforma, precisamos verificar a tua identidade.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Benefícios da verificação:</h3>
              <div className="space-y-2">
                {[
                  { icon: CheckCircle, text: "Maior limite de transações" },
                  { icon: Shield, text: "Proteção contra fraude" },
                  { icon: Clock, text: "Processos mais rápidos" },
                  { icon: Star, text: "Acesso a funcionalidades premium" }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <benefit.icon className="w-4 h-4 text-green-600" />
                    <span>{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-semibold text-blue-900 text-sm mb-2">O que vais precisar:</h4>
              <div className="space-y-1 text-xs text-blue-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>Documento de identificação válido (CC, Passaporte)</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>Selfie segurando o documento</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Apenas 5-10 minutos</span>
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleStartKycWizard}
                className="w-full"
                size="lg"
              >
                <Shield className="w-4 h-4 mr-2" />
                Começar Verificação
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSkipping}
                size="sm"
                className="text-muted-foreground"
              >
                {isSkipping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    A processar...
                  </>
                ) : (
                  'Fazer mais tarde'
                )}
              </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
              🔒 Os teus dados são protegidos segundo normas GDPR e nunca partilhados com terceiros.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <KycWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={handleKycComplete}
      />
    </>
  );
};

export default KycPopup;