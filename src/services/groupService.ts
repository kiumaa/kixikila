import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type GroupStatus = 'active' | 'ready_for_draw' | 'completed' | 'pending' | 'suspended';
export type GroupPrivacy = 'public' | 'private' | 'invite_only';

export type AdminGroup = {
  id: string;
  name: string;
  description: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  current_members: number;
  status: GroupStatus;
  privacy: GroupPrivacy;
  category: string;
  created_at: string;
  updated_at: string;
  admin_id: string;
  total_pool: number;
  cycle: number;
  next_payment_date: string;
  members: Array<{
    id: string;
    name: string;
    paid: boolean;
    avatar: string;
    is_admin: boolean;
  }>;
};

export type GroupAnalytics = {
  totalGroups: number;
  activeGroups: number;
  completedGroups: number;
  suspendedGroups: number;
  totalMembers: number;
  averageGroupSize: number;
  totalPoolValue: number;
  completionRate: number;
};

// For now, use mock data since groups table doesn't exist yet
export class GroupService {
  // Get groups with filters and pagination
  static async getGroups(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  } = {}) {
    // Mock implementation using existing mock data
    const { mockGroups } = await import('@/data/mockData');
    
    let filteredGroups = mockGroups.filter(group => {
      const matchesSearch = !options.search || 
        group.name.toLowerCase().includes(options.search.toLowerCase()) ||
        group.description.toLowerCase().includes(options.search.toLowerCase());
      
      const matchesStatus = !options.status || group.status === options.status;
      const matchesCategory = !options.category || group.category === options.category;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });

    // Convert to AdminGroup format
    const transformedGroups: AdminGroup[] = filteredGroups.map(group => ({
      id: group.id.toString(),
      name: group.name,
      description: group.description,
      contribution_amount: group.contributionAmount,
      frequency: group.frequency,
      max_members: group.maxMembers,
      current_members: group.currentMembers,
      status: group.status as GroupStatus,
      privacy: group.privacy as GroupPrivacy,
      category: group.category,
      created_at: group.startDate,
      updated_at: new Date().toISOString(),
      admin_id: group.adminId.toString(),
      total_pool: group.totalPool,
      cycle: group.cycle,
      next_payment_date: group.nextPaymentDate,
      members: group.members.map(member => ({
        id: member.id.toString(),
        name: member.name,
        paid: member.paid,
        avatar: member.avatar,
        is_admin: member.isAdmin || false
      }))
    }));

    return { groups: transformedGroups, totalCount: transformedGroups.length };
  }

  // Get group analytics
  static async getGroupAnalytics(): Promise<GroupAnalytics> {
    // Mock implementation
    const { mockGroups } = await import('@/data/mockData');
    
    const analytics = mockGroups.reduce((acc, group) => {
      acc.totalGroups++;
      
      if (group.status === 'active') acc.activeGroups++;
      if (group.status === 'completed') acc.completedGroups++;
      // Note: mock data doesn't have suspended status, so this won't increment
      
      acc.totalMembers += group.currentMembers;
      acc.totalPoolValue += group.totalPool;
      
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
    });

    analytics.averageGroupSize = analytics.totalGroups > 0 
      ? analytics.totalMembers / analytics.totalGroups 
      : 0;
    
    analytics.completionRate = analytics.totalGroups > 0 
      ? (analytics.completedGroups / analytics.totalGroups) * 100 
      : 0;

    return analytics;
  }

  // Suspend/unsuspend a group
  static async updateGroupStatus(groupId: string, status: GroupStatus, reason?: string) {
    // Mock implementation - in reality this would update the database
    console.log(`Group ${groupId} status updated to ${status}`, { reason });
    
    // Mock successful response
    return { id: groupId, status, updated_at: new Date().toISOString() };
  }

  // Delete a group
  static async deleteGroup(groupId: string) {
    // Mock implementation - in reality this would delete from database
    console.log(`Group ${groupId} deleted`);
  }

  // Get group performance metrics - mock implementation
  static async getGroupPerformance(groupId: string) {
    return {
      paymentRate: 85,
      totalTransacted: 2400,
      memberCount: 8,
      completedCycles: 3,
      lastActivity: new Date().toISOString()
    };
  }
}