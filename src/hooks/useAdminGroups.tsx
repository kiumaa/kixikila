import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/lib/utils';

export interface AdminGroup extends Group {
  creator?: {
    full_name: string;
    email: string;
  };
  category?: string;
  privacy?: 'private' | 'public' | 'invite_only';
  // Legacy compatibility properties
  contributionAmount?: number;
  maxMembers?: number;
  currentMembers?: number;
  totalPool?: number;
  nextPaymentDate?: string;
  cycle?: number;
}

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

      // Transform data to include member info and legacy compatibility
      const transformedGroups: AdminGroup[] = (data || []).map(group => ({
        ...group,
        // Legacy compatibility properties
        contributionAmount: group.contribution_amount,
        maxMembers: group.max_members,
        currentMembers: group.current_members,
        totalPool: group.total_pool,
        nextPaymentDate: group.next_payment_date,
        cycle: group.current_cycle,
        category: group.type,
        privacy: group.is_private ? 'private' : 'public',
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
    refetch
  };
};