import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by: string;
  email?: string;
  phone?: string;
  invite_token: string;
  role: 'member' | 'admin';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  message?: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

interface UseGroupInvitationsProps {
  groupId?: string;
}

interface UseGroupInvitationsReturn {
  invitations: GroupInvitation[];
  loading: boolean;
  error: string | null;
  fetchInvitations: () => Promise<void>;
  acceptInvitation: (token: string) => Promise<boolean>;
  declineInvitation: (token: string) => Promise<boolean>;
  resendInvitation: (invitationId: string) => Promise<boolean>;
  cancelInvitation: (invitationId: string) => Promise<boolean>;
}

export const useGroupInvitations = ({ 
  groupId 
}: UseGroupInvitationsProps = {}): UseGroupInvitationsReturn => {
  const [invitations, setInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInvitations = async () => {
    if (!groupId) return;
    
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('group_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupId) {
        query = query.eq('group_id', groupId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      // Map the data to ensure correct types
      const mappedInvitations = (data || []).map(item => ({
        id: item.id,
        group_id: item.group_id,
        invited_by: item.invited_by,
        email: item.email,
        phone: item.phone,
        invite_token: item.invite_token,
        role: (item.role === 'admin' ? 'admin' : 'member') as 'member' | 'admin',
        status: item.status as 'pending' | 'accepted' | 'declined' | 'expired',
        message: item.message,
        expires_at: item.expires_at,
        accepted_at: item.accepted_at,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      setInvitations(mappedInvitations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch invitations';
      setError(errorMessage);
      console.error('Error fetching invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Use the database function to accept invitation
      const { error } = await supabase
        .rpc('accept_group_invitation', { invitation_token: token });

      if (error) {
        throw error;
      }

      toast({
        title: "Convite aceito!",
        description: "Bem-vindo ao grupo! Você agora é membro."
      });

      // Refresh invitations
      await fetchInvitations();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      
      toast({
        title: "Erro ao aceitar convite",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const declineInvitation = async (token: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_invitations')
        .update({ 
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('invite_token', token);

      if (error) {
        throw error;
      }

      toast({
        title: "Convite recusado",
        description: "O convite foi recusado."
      });

      // Refresh invitations
      await fetchInvitations();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMessage);
      
      toast({
        title: "Erro ao recusar convite",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      // Get invitation details
      const { data: invitation, error: fetchError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (fetchError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Use the edge function to resend invitation
      const { error } = await supabase.functions.invoke('send-group-invitation', {
        body: {
          groupId: invitation.group_id,
          emails: invitation.email ? [invitation.email] : [],
          phones: invitation.phone ? [invitation.phone] : [],
          role: invitation.role,
          message: invitation.message || ''
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Convite reenviado",
        description: "O convite foi enviado novamente."
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(errorMessage);
      
      toast({
        title: "Erro ao reenviar convite",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelInvitation = async (invitationId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('group_invitations')
        .update({ 
          status: 'expired',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) {
        throw error;
      }

      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado."
      });

      // Refresh invitations
      await fetchInvitations();
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      setError(errorMessage);
      
      toast({
        title: "Erro ao cancelar convite",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchInvitations();
    }
  }, [groupId]);

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    acceptInvitation,
    declineInvitation,
    resendInvitation,
    cancelInvitation
  };
};