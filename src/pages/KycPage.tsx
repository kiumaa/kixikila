import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KycWizard } from '@/components/modals/KycWizard';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

const KycPage: React.FC = () => {
  const navigate = useNavigate();
  const { getProfile } = useAuthStore();
  const [isKycOpen] = useState(true);

  const handleKycComplete = async () => {
    try {
      // Refresh user profile to get updated KYC status
      await getProfile();
      
      toast.success('Verificação KYC concluída! 🎉');
      
      // Navigate to dashboard after KYC completion
      navigate('/app/dashboard');
    } catch (error) {
      console.error('Error after KYC completion:', error);
      toast.error('Erro após verificação KYC');
      navigate('/app/dashboard');
    }
  };

  const handleKycClose = () => {
    // User can't close KYC if it's required
    toast.info('A verificação KYC é obrigatória para usar a aplicação');
  };

  return (
    <KycWizard
      isOpen={isKycOpen}
      onClose={handleKycClose}
      onComplete={handleKycComplete}
    />
  );
};

export default KycPage;