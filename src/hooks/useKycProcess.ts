import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export type KycStatus = 'not_started' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'incomplete';

export type KycLevel = 'basic' | 'standard' | 'premium';

export interface PersonalInfo {
  fullName: string;
  dateOfBirth: string;
  address: string;
  city: string;
  postalCode: string;
  nationality: string;
}

export interface DocumentInfo {
  type: 'id_card' | 'passport' | 'driving_license';
  number: string;
  expiryDate: string;
  frontImage?: File;
  backImage?: File;
}

export interface KycData {
  personalInfo: PersonalInfo;
  document: DocumentInfo;
  selfieImage?: File;
  level: KycLevel;
  status: KycStatus;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

const STORAGE_KEY = 'kixikila_kyc_data';

export const useKycProcess = () => {
  const [kycData, setKycData] = useState<KycData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {
      personalInfo: {
        fullName: '',
        dateOfBirth: '',
        address: '',
        city: '',
        postalCode: '',
        nationality: 'Portugal'
      },
      document: {
        type: 'id_card' as const,
        number: '',
        expiryDate: ''
      },
      level: 'standard' as KycLevel,
      status: 'not_started' as KycStatus
    };
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kycData));
  }, [kycData]);

  const updatePersonalInfo = (info: Partial<PersonalInfo>) => {
    setKycData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info }
    }));
  };

  const updateDocument = (doc: Partial<DocumentInfo>) => {
    setKycData(prev => ({
      ...prev,
      document: { ...prev.document, ...doc }
    }));
  };

  const updateSelfie = (file: File) => {
    setKycData(prev => ({
      ...prev,
      selfieImage: file
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Info
        const { fullName, dateOfBirth, address, city, postalCode } = kycData.personalInfo;
        return !!(fullName && dateOfBirth && address && city && postalCode);
      
      case 2: // Document
        const { type, number, expiryDate, frontImage } = kycData.document;
        return !!(type && number && expiryDate && frontImage);
      
      case 3: // Selfie (optional for standard level)
        return kycData.level === 'basic' || kycData.level === 'standard' || !!kycData.selfieImage;
      
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preenche todos os campos necessários.",
        variant: "destructive"
      });
    }
  };

  const previousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const submitKyc = async (): Promise<boolean> => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call with realistic delay
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
      
      // Mock approval/rejection (90% approval rate)
      const isApproved = Math.random() > 0.1;
      
      setKycData(prev => ({
        ...prev,
        status: isApproved ? 'approved' : 'rejected',
        submittedAt: new Date().toISOString(),
        reviewedAt: new Date().toISOString(),
        rejectionReason: isApproved ? undefined : 'Documento não legível. Por favor, envia uma foto mais clara.'
      }));

      toast({
        title: isApproved ? "Verificação Aprovada!" : "Verificação Rejeitada",
        description: isApproved 
          ? "A tua identidade foi verificada com sucesso."
          : "Por favor, verifica os documentos e tenta novamente.",
        variant: isApproved ? "default" : "destructive"
      });

      return isApproved;
    } catch (error) {
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro. Tenta novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetKyc = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKycData({
      personalInfo: {
        fullName: '',
        dateOfBirth: '',
        address: '',
        city: '',
        postalCode: '',
        nationality: 'Portugal'
      },
      document: {
        type: 'id_card',
        number: '',
        expiryDate: ''
      },
      level: 'standard',
      status: 'not_started'
    });
    setCurrentStep(1);
  };

  const getStepProgress = () => {
    const totalSteps = kycData.level === 'premium' ? 4 : 3;
    return (currentStep - 1) / totalSteps * 100;
  };

  return {
    kycData,
    currentStep,
    isSubmitting,
    updatePersonalInfo,
    updateDocument,
    updateSelfie,
    validateStep,
    nextStep,
    previousStep,
    submitKyc,
    resetKyc,
    setCurrentStep,
    getStepProgress
  };
};