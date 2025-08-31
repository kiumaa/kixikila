import React, { useState } from 'react';
import { Shield, Camera, FileText, CheckCircle, Upload, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KycWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface KycData {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    occupation: string;
    address: string;
    city: string;
    postalCode: string;
  };
  documents: {
    idType: 'passport' | 'id_card' | 'drivers_license' | '';
    idNumber: string;
    idFront?: File;
    idBack?: File;
    selfie?: File;
  };
  verification: {
    incomeSource: string;
    monthlyIncome: string;
    purposeOfAccount: string;
  };
}

export const KycWizard = ({ isOpen, onClose, onComplete }: KycWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [kycData, setKycData] = useState<KycData>({
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      nationality: 'Portugal',
      occupation: '',
      address: '',
      city: '',
      postalCode: ''
    },
    documents: {
      idType: '',
      idNumber: '',
    },
    verification: {
      incomeSource: '',
      monthlyIncome: '',
      purposeOfAccount: ''
    }
  });

  const handleFileUpload = (fileType: keyof KycData['documents'], file: File) => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Ficheiro muito grande",
        description: "O tamanho máximo é de 5MB",
        variant: "destructive",
      });
      return;
    }

    setKycData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [fileType]: file
      }
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Simulate KYC submission to backend
      const { data, error } = await supabase.functions.invoke('kyc-management', {
        body: {
          action: 'submit',
          kycData: {
            ...kycData,
            documents: {
              ...kycData.documents,
              // Convert files to base64 for demo purposes
              // In production, these would be uploaded to secure storage
              idFront: kycData.documents.idFront?.name,
              idBack: kycData.documents.idBack?.name,
              selfie: kycData.documents.selfie?.name,
            }
          }
        }
      });

      if (error) throw error;

      toast({
        title: "KYC submetido com sucesso! ✅",
        description: "A verificação será processada em 24-48 horas",
        variant: "default",
      });

      // Mock instant approval for demo
      setTimeout(() => {
        toast({
          title: "Verificação aprovada! 🎉",
          description: "A tua identidade foi verificada com sucesso",
          variant: "default",
        });
        onComplete();
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao submeter KYC:', error);
      toast({
        title: "Erro na submissão",
        description: error.message || "Tenta novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1: Personal Information
  const PersonalInfoStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold">Informação Pessoal</h3>
        <p className="text-sm text-muted-foreground">Confirma os teus dados pessoais</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            value={kycData.personalInfo.fullName}
            onChange={(e) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, fullName: e.target.value }
            }))}
            placeholder="João Silva Santos"
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Data de nascimento</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={kycData.personalInfo.dateOfBirth}
            onChange={(e) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nationality">Nacionalidade</Label>
          <Select
            value={kycData.personalInfo.nationality}
            onValueChange={(value) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, nationality: value }
            }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Portugal">Portugal</SelectItem>
              <SelectItem value="Brasil">Brasil</SelectItem>
              <SelectItem value="Angola">Angola</SelectItem>
              <SelectItem value="Outros">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="occupation">Profissão</Label>
          <Input
            id="occupation"
            value={kycData.personalInfo.occupation}
            onChange={(e) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, occupation: e.target.value }
            }))}
            placeholder="Engenheiro de Software"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Morada</Label>
        <Input
          id="address"
          value={kycData.personalInfo.address}
          onChange={(e) => setKycData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, address: e.target.value }
          }))}
          placeholder="Rua das Flores, 123"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={kycData.personalInfo.city}
            onChange={(e) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, city: e.target.value }
            }))}
            placeholder="Lisboa"
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Código Postal</Label>
          <Input
            id="postalCode"
            value={kycData.personalInfo.postalCode}
            onChange={(e) => setKycData(prev => ({
              ...prev,
              personalInfo: { ...prev.personalInfo, postalCode: e.target.value }
            }))}
            placeholder="1000-001"
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Document Upload
  const DocumentsStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-8 h-8 text-secondary" />
        </div>
        <h3 className="text-xl font-semibold">Documentos de Identificação</h3>
        <p className="text-sm text-muted-foreground">Carrega os documentos necessários</p>
      </div>

      <div>
        <Label>Tipo de documento</Label>
        <Select
          value={kycData.documents.idType}
          onValueChange={(value: any) => setKycData(prev => ({
            ...prev,
            documents: { ...prev.documents, idType: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleciona o tipo de documento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="id_card">Cartão de Cidadão</SelectItem>
            <SelectItem value="passport">Passaporte</SelectItem>
            <SelectItem value="drivers_license">Carta de Condução</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="idNumber">Número do documento</Label>
        <Input
          id="idNumber"
          value={kycData.documents.idNumber}
          onChange={(e) => setKycData(prev => ({
            ...prev,
            documents: { ...prev.documents, idNumber: e.target.value }
          }))}
          placeholder="123456789"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Frente do documento</Label>
            {kycData.documents.idFront && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('idFront', e.target.files[0])}
              className="hidden"
              id="idFront"
            />
            <label htmlFor="idFront" className="cursor-pointer">
              <Button variant="ghost" asChild>
                <span>Carregar imagem</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Verso do documento</Label>
            {kycData.documents.idBack && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('idBack', e.target.files[0])}
              className="hidden"
              id="idBack"
            />
            <label htmlFor="idBack" className="cursor-pointer">
              <Button variant="ghost" asChild>
                <span>Carregar imagem</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG até 5MB</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Selfie com documento</Label>
            {kycData.documents.selfie && <CheckCircle className="w-5 h-5 text-green-500" />}
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileUpload('selfie', e.target.files[0])}
              className="hidden"
              id="selfie"
            />
            <label htmlFor="selfie" className="cursor-pointer">
              <Button variant="ghost" asChild>
                <span>Tirar/Carregar selfie</span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-1">Segura o documento ao lado do rosto</p>
          </div>
        </Card>
      </div>
    </div>
  );

  // Step 3: Verification
  const VerificationStep = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-xl font-semibold">Verificação Adicional</h3>
        <p className="text-sm text-muted-foreground">Últimas informações para compliance</p>
      </div>

      <div>
        <Label>Fonte de rendimento</Label>
        <Select
          value={kycData.verification.incomeSource}
          onValueChange={(value) => setKycData(prev => ({
            ...prev,
            verification: { ...prev.verification, incomeSource: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleciona a fonte de rendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="employment">Emprego por conta de outrem</SelectItem>
            <SelectItem value="business">Negócio próprio</SelectItem>
            <SelectItem value="freelance">Freelancer</SelectItem>
            <SelectItem value="pension">Reforma/Pensão</SelectItem>
            <SelectItem value="investments">Investimentos</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Rendimento mensal estimado</Label>
        <Select
          value={kycData.verification.monthlyIncome}
          onValueChange={(value) => setKycData(prev => ({
            ...prev,
            verification: { ...prev.verification, monthlyIncome: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleciona a faixa de rendimento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="<1000">Menos de €1.000</SelectItem>
            <SelectItem value="1000-2500">€1.000 - €2.500</SelectItem>
            <SelectItem value="2500-5000">€2.500 - €5.000</SelectItem>
            <SelectItem value="5000-10000">€5.000 - €10.000</SelectItem>
            <SelectItem value=">10000">Mais de €10.000</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Finalidade da conta</Label>
        <Select
          value={kycData.verification.purposeOfAccount}
          onValueChange={(value) => setKycData(prev => ({
            ...prev,
            verification: { ...prev.verification, purposeOfAccount: value }
          }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleciona a finalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="savings">Poupança pessoal</SelectItem>
            <SelectItem value="group_savings">Poupança em grupo</SelectItem>
            <SelectItem value="investment">Investimento</SelectItem>
            <SelectItem value="business">Negócios</SelectItem>
            <SelectItem value="family">Gestão familiar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900">Porquê esta informação?</h4>
            <p className="text-xs text-blue-700 mt-1">
              Estas informações são obrigatórias por lei para prevenção de branqueamento de capitais 
              e financiamento ao terrorismo (AML/CFT).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return kycData.personalInfo.fullName && 
               kycData.personalInfo.dateOfBirth && 
               kycData.personalInfo.nationality &&
               kycData.personalInfo.occupation &&
               kycData.personalInfo.address &&
               kycData.personalInfo.city;
      case 2:
        return kycData.documents.idType && 
               kycData.documents.idNumber && 
               kycData.documents.idFront && 
               kycData.documents.idBack && 
               kycData.documents.selfie;
      case 3:
        return kycData.verification.incomeSource && 
               kycData.verification.monthlyIncome && 
               kycData.verification.purposeOfAccount;
      default:
        return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Verificação de Identidade (KYC)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  step <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`w-12 h-0.5 ${
                    step < currentStep ? 'bg-primary' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="mt-8">
            {currentStep === 1 && <PersonalInfoStep />}
            {currentStep === 2 && <DocumentsStep />}
            {currentStep === 3 && <VerificationStep />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => currentStep === 1 ? onClose() : setCurrentStep(currentStep - 1)}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            <Button
              onClick={() => {
                if (currentStep === 3) {
                  handleSubmit();
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={!isStepValid() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Processando...
                </>
              ) : currentStep === 3 ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submeter KYC
                </>
              ) : (
                <>
                  Seguinte
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Legal Notice */}
          <div className="text-center text-xs text-muted-foreground bg-gray-50 rounded-lg p-3">
            🔒 Os teus dados são encriptados e protegidos segundo as normas GDPR. 
            Nunca partilhamos informação pessoal com terceiros.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};