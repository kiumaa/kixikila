import React from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useKycProcess } from '@/hooks/useKycProcess';
import PersonalInfoStep from './PersonalInfoStep';
import DocumentUploadStep from './DocumentUploadStep';
import FaceVerificationStep from './FaceVerificationStep';

interface KycWizardProps {
  onClose: () => void;
  onComplete: () => void;
}

const KycWizard = ({ onClose, onComplete }: KycWizardProps) => {
  const {
    kycData,
    currentStep,
    isSubmitting,
    validateStep,
    nextStep,
    previousStep,
    submitKyc,
    getStepProgress
  } = useKycProcess();

  const totalSteps = kycData.level === 'premium' ? 4 : 3;
  
  const stepTitles = [
    'Informações Pessoais',
    'Documento de Identidade',
    'Verificação Facial',
    'Confirmação'
  ];

  const handleNext = () => {
    if (currentStep === totalSteps) {
      handleSubmit();
    } else {
      nextStep();
    }
  };

  const handleSubmit = async () => {
    const success = await submitKyc();
    if (success) {
      onComplete();
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInfoStep />;
      case 2:
        return <DocumentUploadStep />;
      case 3:
        return <FaceVerificationStep />;
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Pronto para submeter!</h3>
              <p className="text-muted-foreground">
                Revê os teus dados e confirma a submissão para análise.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Dados Pessoais</h4>
                <p className="text-sm text-muted-foreground">
                  {kycData.personalInfo.fullName} • {kycData.personalInfo.dateOfBirth}
                </p>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Documento</h4>
                <p className="text-sm text-muted-foreground">
                  {kycData.document.type === 'id_card' ? 'Cartão de Cidadão' :
                   kycData.document.type === 'passport' ? 'Passaporte' : 'Carta de Condução'} • {kycData.document.number}
                </p>
              </div>
              
              {kycData.selfieImage && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">Verificação Facial</h4>
                  <p className="text-sm text-muted-foreground">✅ Selfie capturada</p>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-background z-50">
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-primary-foreground hover:bg-primary-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold">Verificação de Identidade</h1>
            <div className="w-9" /> {/* Spacer */}
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Passo {currentStep} de {totalSteps}</span>
              <span>{Math.round(getStepProgress())}%</span>
            </div>
            <Progress value={getStepProgress()} className="bg-primary-foreground/20" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-center">
                {stepTitles[currentStep - 1]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}
              
              {/* Navigation */}
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={previousStep}
                    disabled={isSubmitting}
                  >
                    Anterior
                  </Button>
                )}
                
                <Button
                  className="flex-1"
                  onClick={handleNext}
                  disabled={!validateStep(currentStep) || isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      A processar...
                    </div>
                  ) : currentStep === totalSteps ? (
                    'Submeter'
                  ) : (
                    'Continuar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default KycWizard;