import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group, GroupMember } from '@/lib/utils';

export interface AdminGroup extends Group {
  creator?: {
    full_name: string;
    email: string;
  };
  category?: string;
  privacy?: 'private' | 'public' | 'invite_only';
  requires_approval?: boolean;
}

export const useGroupAnalytics = () => {
  return {
    totalCount: 0,
    activeCount: 0,
    pendingCount: 0
  };
};

export const useAdminGroups = () => {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('groups')
        .select(`
          *,
          creator:users!groups_creator_id_fkey (
            full_name,
            email
          ),
          group_members (
            id,
            user_id,
            status,
            role,
            total_contributed,
            current_balance,
            joined_at,
            users (
              full_name,
              avatar_url
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      // Transform data to match Group interface
      const transformedGroups: AdminGroup[] = (data || []).map(group => ({
        id: group.id,
        name: group.name,
        description: group.description || '',
        contribution_amount: group.contribution_amount,
        max_members: group.max_members,
        current_members: group.current_members,
        total_pool: group.total_pool,
        next_payment_date: group.next_payout_date || group.created_at,
        status: group.status,
        group_type: group.group_type,
        current_cycle: group.current_cycle || 1,
        is_private: group.is_private,
        creator_id: group.creator_id,
        created_at: group.created_at,
        updated_at: group.updated_at,
        category: group.group_type,
        privacy: group.is_private ? 'private' : 'public',
        frequency: 'mensal',
        // Transform members data
        members: (group.group_members || []).map((member: any) => ({
          id: member.id,
          user_id: member.user_id,
          name: member.users?.full_name || 'Utilizador',
          avatar: member.users?.full_name?.charAt(0) || 'U',
          avatar_url: member.users?.avatar_url,
          paid: member.current_balance > 0,
          is_admin: member.role === 'admin' || member.role === 'creator',
          joined_at: member.joined_at
        }))
      }));

      setGroups(transformedGroups);
    } catch (err: any) {
      console.error('Error fetching admin groups:', err);
      setError(err.message || 'Erro ao carregar grupos');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGroupStatus = async (groupId: string, status: string) => {
    // Implementation for updating group status
  };

  const deleteGroup = async (groupId: string) => {
    // Implementation for deleting group
  };

  const refetch = () => {
    fetchGroups();
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    isLoading,
    error,
    refetch,
    totalCount: groups.length,
    updateGroupStatus,
    deleteGroup
  };
};