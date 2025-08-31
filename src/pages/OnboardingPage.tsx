import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingScreen } from '@/features/onboarding/OnboardingScreen';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, getProfile } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsCompleting(true);
    try {
      // Mark first_login as false
      const { error } = await supabase
        .from('users')
        .update({ first_login: false })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh user profile
      await getProfile();
      
      toast.success('Bem-vindo ao KIXIKILA! 🎉');
      
      // Navigate to next appropriate screen (KYC or dashboard)
      if (user.kyc_status === 'pending') {
        toast.info('A seguir: Verificação de identidade');
        navigate('/kyc');
      } else {
        toast.success('Conta configurada! A redireccionar...');
        navigate('/app/dashboard');
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Erro ao finalizar introdução');
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <OnboardingScreen
      step={currentStep}
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
};

export default OnboardingPage;