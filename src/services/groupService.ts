import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type GroupRow = Database['public']['Tables']['groups']['Row'];
type GroupInsert = Database['public']['Tables']['groups']['Insert'];
type GroupUpdate = Database['public']['Tables']['groups']['Update'];
type GroupMemberRow = Database['public']['Tables']['group_members']['Row'];

export type GroupStatus = GroupRow['status'];
export type GroupPrivacy = 'public' | 'private' | 'invite_only';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  current_members: number;
  status: GroupStatus;
  privacy: GroupPrivacy;
  category: string;
  created_at: string;
  updated_at: string;
  creator_id: string;
  total_pool: number;
  next_payment_date: string | null;
  group_type: GroupRow['group_type'];
  cycle?: number; // Optional for backward compatibility
  members?: GroupMember[];
  history?: GroupCycle[];
}

// Legacy alias for compatibility
export type AdminGroup = Group;

export interface GroupMember {
  id: string;
  user_id: string;
  name: string;
  paid: boolean;
  avatar: string;
  is_admin: boolean;
  role: GroupMemberRow['role'];
  status: GroupMemberRow['status'];
  position?: number | null;
  total_contributed: number;
  current_balance: number;
}

export interface GroupCycle {
  cycle: number;
  winner: string;
  amount: number;
  date: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  contribution_amount: number;
  max_members: number;
  group_type: GroupRow['group_type'];
  is_private: boolean;
}

export interface GroupAnalytics {
  totalGroups: number;
  activeGroups: number;
  completedGroups: number;
  suspendedGroups: number;
  totalMembers: number;
  averageGroupSize: number;
  totalPoolValue: number;
  completionRate: number;
}

export class GroupService {
  // Get user's groups
  static async getUserGroups(): Promise<{ groups: Group[]; totalCount: number }> {
    try {
      const { data: userGroupsData, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          status,
          groups!inner (
            id,
            name,
            description,
            contribution_amount,
            contribution_frequency,
            max_members,
            current_members,
            status,
            is_private,
            total_pool,
            next_payout_date,
            group_type,
            creator_id,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'active');

      if (error) throw error;

      const groups: Group[] = userGroupsData?.map(item => ({
        id: item.groups.id,
        name: item.groups.name,
        description: item.groups.description,
        contribution_amount: item.groups.contribution_amount,
        frequency: item.groups.contribution_frequency,
        max_members: item.groups.max_members,
        current_members: item.groups.current_members,
        status: item.groups.status,
        privacy: item.groups.is_private ? 'private' : 'public',
        category: 'general', // Default category
        created_at: item.groups.created_at,
        updated_at: item.groups.updated_at,
        creator_id: item.groups.creator_id,
        total_pool: item.groups.total_pool,
        next_payment_date: item.groups.next_payout_date,
        group_type: item.groups.group_type
      })) || [];

      return { groups, totalCount: groups.length };
    } catch (error) {
      console.error('Error fetching user groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  // Get all groups with filters (for admin)
  static async getAllGroups(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  } = {}): Promise<{ groups: Group[]; totalCount: number }> {
    try {
      let query = supabase.from('groups').select('*', { count: 'exact' });

      // Apply filters
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }
      if (options.status && ['active', 'draft', 'paused', 'completed', 'cancelled'].includes(options.status)) {
        query = query.eq('status', options.status as GroupStatus);
      }

      // Apply pagination
      if (options.page && options.limit) {
        const from = (options.page - 1) * options.limit;
        const to = from + options.limit - 1;
        query = query.range(from, to);
      }

      const { data, error, count } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      const groups: Group[] = data?.map(group => ({
        id: group.id,
        name: group.name,
        description: group.description,
        contribution_amount: group.contribution_amount,
        frequency: group.contribution_frequency,
        max_members: group.max_members,
        current_members: group.current_members,
        status: group.status,
        privacy: group.is_private ? 'private' : 'public',
        category: 'general',
        created_at: group.created_at,
        updated_at: group.updated_at,
        creator_id: group.creator_id,
        total_pool: group.total_pool,
        next_payment_date: group.next_payout_date,
        group_type: group.group_type
      })) || [];

      return { groups, totalCount: count || 0 };
    } catch (error) {
      console.error('Error fetching all groups:', error);
      throw new Error('Failed to fetch groups');
    }
  }

  // Get group by ID with members
  static async getGroupById(groupId: string): Promise<Group | null> {
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;
      if (!group) return null;

      // Get group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          *,
          users!group_members_user_id_fkey(id, full_name, avatar_url)
        `)
        .eq('group_id', groupId)
        .eq('status', 'active');

      if (membersError) throw membersError;

      const members: GroupMember[] = membersData?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        name: member.users.full_name,
        paid: false, // TODO: Get from transactions
        avatar: member.users.avatar_url || member.users.full_name.charAt(0),
        is_admin: member.role === 'admin' || member.role === 'creator',
        role: member.role,
        status: member.status,
        position: member.payout_position,
        total_contributed: member.total_contributed,
        current_balance: member.current_balance
      })) || [];

      return {
        id: group.id,
        name: group.name,
        description: group.description,
        contribution_amount: group.contribution_amount,
        frequency: group.contribution_frequency,
        max_members: group.max_members,
        current_members: group.current_members,
        status: group.status,
        privacy: group.is_private ? 'private' : 'public',
        category: 'general',
        created_at: group.created_at,
        updated_at: group.updated_at,
        creator_id: group.creator_id,
        total_pool: group.total_pool,
        next_payment_date: group.next_payout_date,
        group_type: group.group_type,
        members
      };
    } catch (error) {
      console.error('Error fetching group by ID:', error);
      return null;
    }
  }

  // Create new group
  static async createGroup(groupData: CreateGroupData): Promise<Group> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupData.name,
          description: groupData.description,
          contribution_amount: groupData.contribution_amount,
          max_members: groupData.max_members,
          group_type: groupData.group_type,
          is_private: groupData.is_private,
          creator_id: user.data.user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as group admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: user.data.user.id,
          role: 'creator',
          status: 'active'
        });

      if (memberError) throw memberError;

      return {
        id: newGroup.id,
        name: newGroup.name,
        description: newGroup.description,
        contribution_amount: newGroup.contribution_amount,
        frequency: newGroup.contribution_frequency,
        max_members: newGroup.max_members,
        current_members: newGroup.current_members,
        status: newGroup.status,
        privacy: newGroup.is_private ? 'private' : 'public',
        category: 'general',
        created_at: newGroup.created_at,
        updated_at: newGroup.updated_at,
        creator_id: newGroup.creator_id,
        total_pool: newGroup.total_pool,
        next_payment_date: newGroup.next_payout_date,
        group_type: newGroup.group_type
      };
    } catch (error) {
      console.error('Error creating group:', error);
      throw new Error('Failed to create group');
    }
  }

  // Get group analytics
  static async getGroupAnalytics(): Promise<GroupAnalytics> {
    try {
      const { data: stats, error } = await supabase
        .rpc('get_group_statistics', { target_group_id: null });

      if (error) throw error;

      // Get all groups for detailed analytics
      const { data: allGroups, error: groupsError } = await supabase
        .from('groups')
        .select('status, current_members, total_pool');

      if (groupsError) throw groupsError;

      const analytics = allGroups?.reduce((acc, group) => {
        acc.totalGroups++;
        
        switch (group.status) {
          case 'active':
            acc.activeGroups++;
            break;
          case 'completed':
            acc.completedGroups++;
            break;
          case 'cancelled':
            acc.suspendedGroups++;
            break;
        }
        
        acc.totalMembers += group.current_members || 0;
        acc.totalPoolValue += Number(group.total_pool) || 0;
        
        return acc;
      }, {
        totalGroups: 0,
        activeGroups: 0,
        completedGroups: 0,
        suspendedGroups: 0,
        totalMembers: 0,
        averageGroupSize: 0,
        totalPoolValue: 0,
        completionRate: 0
      }) || {
        totalGroups: 0,
        activeGroups: 0,
        completedGroups: 0,
        suspendedGroups: 0,
        totalMembers: 0,
        averageGroupSize: 0,
        totalPoolValue: 0,
        completionRate: 0
      };

      analytics.averageGroupSize = analytics.totalGroups > 0 
        ? analytics.totalMembers / analytics.totalGroups 
        : 0;
      
      analytics.completionRate = analytics.totalGroups > 0 
        ? (analytics.completedGroups / analytics.totalGroups) * 100 
        : 0;

      return analytics;
    } catch (error) {
      console.error('Error fetching group analytics:', error);
      throw new Error('Failed to fetch analytics');
    }
  }

  // Update group status
  static async updateGroupStatus(groupId: string, status: GroupStatus, reason?: string): Promise<Group> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', groupId)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        contribution_amount: data.contribution_amount,
        frequency: data.contribution_frequency,
        max_members: data.max_members,
        current_members: data.current_members,
        status: data.status,
        privacy: data.is_private ? 'private' : 'public',
        category: 'general',
        created_at: data.created_at,
        updated_at: data.updated_at,
        creator_id: data.creator_id,
        total_pool: data.total_pool,
        next_payment_date: data.next_payout_date,
        group_type: data.group_type
      };
    } catch (error) {
      console.error('Error updating group status:', error);
      throw new Error('Failed to update group status');
    }
  }

  // Delete a group (soft delete by updating status)
  static async deleteGroup(groupId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('groups')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', groupId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting group:', error);
      throw new Error('Failed to delete group');
    }
  }

  // Add member to group
  static async addMember(groupId: string, userId: string, role: GroupMemberRow['role'] = 'member'): Promise<GroupMember> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
          status: 'pending'
        })
        .select(`
          *,
          users!group_members_user_id_fkey(id, full_name, avatar_url)
        `)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        user_id: data.user_id,
        name: data.users.full_name,
        paid: false,
        avatar: data.users.avatar_url || data.users.full_name.charAt(0),
        is_admin: data.role === 'admin' || data.role === 'creator',
        role: data.role,
        status: data.status,
        position: data.payout_position,
        total_contributed: data.total_contributed,
        current_balance: data.current_balance
      };
    } catch (error) {
      console.error('Error adding member to group:', error);
      throw new Error('Failed to add member');
    }
  }

  // Remove member from group
  static async removeMember(groupId: string, memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ status: 'left', left_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('id', memberId);

      if (error) throw error;
    } catch (error) {
      console.error('Error removing member from group:', error);
      throw new Error('Failed to remove member');
    }
  }

  // Leave group
  static async leaveGroup(groupId: string): Promise<void> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('group_members')
        .update({ status: 'left', left_at: new Date().toISOString() })
        .eq('group_id', groupId)
        .eq('user_id', user.data.user.id);

      if (error) throw error;
    } catch (error) {
      console.error('Error leaving group:', error);
      throw new Error('Failed to leave group');
    }
  }

  // Get group performance metrics
  static async getGroupPerformance(groupId: string) {
    try {
      const { data, error } = await supabase
        .rpc('get_group_statistics', { target_group_id: groupId });

      if (error) {
        // Fallback if RPC doesn't work
        return {
          paymentRate: 0,
          totalTransacted: 0,
          memberCount: 0,
          completedCycles: 0,
          lastActivity: new Date().toISOString()
        };
      }

      const stats = Array.isArray(data) ? data[0] : data;

      return {
        paymentRate: 85, // TODO: Calculate from actual transactions
        totalTransacted: Number(stats?.total_contributed || 0),
        memberCount: stats?.total_members || 0,
        completedCycles: 0, // TODO: Calculate from group history
        lastActivity: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching group performance:', error);
      return {
        paymentRate: 0,
        totalTransacted: 0,
        memberCount: 0,
        completedCycles: 0,
        lastActivity: new Date().toISOString()
      };
    }
  }

  // Legacy method alias for backward compatibility
  static async getGroups(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  } = {}): Promise<{ groups: Group[]; totalCount: number }> {
    return this.getAllGroups(options);
  }
}