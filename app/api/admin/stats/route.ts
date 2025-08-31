import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    // Get comprehensive system statistics
    const [
      { data: userStats },
      { data: groupStats },
      { data: transactionStats },
      { data: recentActivity }
    ] = await Promise.all([
      // User statistics
      supabase.rpc('get_system_stats').single(),
      
      // Group statistics
      supabase
        .from('groups')
        .select('status, group_type, created_at')
        .then(({ data }) => {
          if (!data) return { data: null };
          
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          return {
            data: {
              total: data.length,
              active: data.filter(g => g.status === 'active').length,
              draft: data.filter(g => g.status === 'draft').length,
              completed: data.filter(g => g.status === 'completed').length,
              by_type: data.reduce((acc, g) => {
                acc[g.group_type] = (acc[g.group_type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              recent: data.filter(g => new Date(g.created_at) >= thirtyDaysAgo).length
            }
          };
        }),
      
      // Transaction statistics
      supabase
        .from('transactions')
        .select('status, type, amount, created_at')
        .then(({ data }) => {
          if (!data) return { data: null };
          
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          
          return {
            data: {
              total: data.length,
              completed: data.filter(t => t.status === 'completed').length,
              pending: data.filter(t => t.status === 'pending').length,
              failed: data.filter(t => t.status === 'failed').length,
              total_volume: data
                .filter(t => t.status === 'completed')
                .reduce((sum, t) => sum + Number(t.amount), 0),
              by_type: data.reduce((acc, t) => {
                acc[t.type] = (acc[t.type] || 0) + 1;
                return acc;
              }, {} as Record<string, number>),
              recent_volume: data
                .filter(t => t.status === 'completed' && new Date(t.created_at) >= thirtyDaysAgo)
                .reduce((sum, t) => sum + Number(t.amount), 0)
            }
          };
        }),
      
      // Recent activity
      supabase
        .from('audit_logs')
        .select('action, entity_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10)
        .then(({ data }) => ({ data: data || [] }))
    ]);

    const stats = {
      users: userStats || {
        total_users: 0,
        active_users: 0,
        vip_users: 0,
        pending_otps: 0,
        unread_notifications: 0
      },
      groups: groupStats || {
        total: 0,
        active: 0,
        draft: 0,
        completed: 0,
        by_type: {},
        recent: 0
      },
      transactions: transactionStats || {
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        total_volume: 0,
        by_type: {},
        recent_volume: 0
      },
      recent_activity: recentActivity || [],
      system_health: {
        uptime: process.uptime(),
        memory_usage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    };

    return createSuccessResponse(stats);

  } catch (error) {
    console.error('Admin get stats error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}