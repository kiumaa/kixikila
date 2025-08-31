import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GroupDetailsScreen } from '@/components/screens/GroupDetailsScreen';
import { GroupService } from '@/services/groupService';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingScreen } from '@/components/screens/LoadingScreen';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { GroupInviteModal } from '@/components/modals/GroupInviteModal';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const GroupDetailsPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [drawingWinner, setDrawingWinner] = useState(false);
  
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
    setShowPaymentModal(true);
  };

  const handleInvite = () => {
    setShowInviteModal(true);
  };

  const handleDrawWinner = async () => {
    if (!group) return;
    
    setDrawingWinner(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('draw-group-winner', {
        body: { groupId: group.id }
      });

      if (error) throw error;

      toast.success(`🎉 Sorteio realizado! ${data.winner.name} foi contemplado(a) com €${data.winner.prize_amount}!`);
      
      // Reload group data to reflect the new cycle
      const groupData = await GroupService.getGroupById(group.id);
      setGroup(groupData);
      
    } catch (error) {
      console.error('Error drawing winner:', error);
      toast.error('Erro ao realizar sorteio. Tente novamente.');
    } finally {
      setDrawingWinner(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Reload group data after successful payment
    if (groupId) {
      try {
        const groupData = await GroupService.getGroupById(groupId);
        setGroup(groupData);
      } catch (error) {
        console.error('Error reloading group after payment:', error);
      }
    }
  };

  return (
    <>
      <GroupDetailsScreen
        group={group}
        currentUserId={user.id}
        onBack={handleBack}
        onPay={handlePay}
        onInvite={handleInvite}
      />
      
      {/* Payment Modal */}
      {showPaymentModal && group && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          group={group}
          currentBalance={user?.wallet_balance || 0}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      
      {/* Invite Modal */}
      {showInviteModal && group && (
        <GroupInviteModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          group={group}
        />
      )}
    </>
  );
};

export default GroupDetailsPage;