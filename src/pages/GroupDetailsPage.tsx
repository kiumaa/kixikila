import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GroupDetailsScreen } from '@/features/groups/GroupDetailsScreen';
import { GroupService } from '@/services/groupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { toast } from 'sonner';

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadGroup = async () => {
      if (!groupId) return;
      
      try {
        const groupData = await GroupService.getGroupById(groupId);
        setGroup(groupData);
      } catch (error) {
        console.error('Error loading group:', error);
        toast.error('Erro ao carregar grupo');
        navigate('/app/dashboard');
      } finally {
        setLoading(false);
      }
    };
    
    loadGroup();
  }, [groupId, navigate]);
  
  if (!groupId) {
    navigate('/app/dashboard');
    return null;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!group || !user) {
    return <div>Group not found</div>;
  }

  const handleBack = () => {
    navigate('/app/dashboard');
  };

  const handlePay = () => {
    // TODO: Implement payment modal
    toast.info('Funcionalidade de pagamento em desenvolvimento');
  };

  const handleInvite = () => {
    // TODO: Implement invite modal
    toast.info('Funcionalidade de convite em desenvolvimento');
  };

  const handleDrawWinner = () => {
    // TODO: Implement draw winner functionality
    toast.info('Funcionalidade de sorteio em desenvolvimento');
  };

  return (
    <GroupDetailsScreen
      group={group}
      userId={user.id}
      onBack={handleBack}
      onPay={handlePay}
      onInvite={handleInvite}
      onDrawWinner={handleDrawWinner}
    />
  );
};

export default GroupDetailsPage;