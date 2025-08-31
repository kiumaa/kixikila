import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const getGroupsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    
    const url = new URL(request.url);
    const { page = '1', limit = '20', search, status, type } = 
      getGroupsSchema.parse(Object.fromEntries(url.searchParams));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('groups')
      .select(`
        *,
        users!creator_id (
          full_name,
          email
        ),
        group_members (
          id,
          status,
          users (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('group_type', type);
    }

    const { data: groups, error, count } = await query;

    if (error) {
      throw error;
    }

    // Add computed stats
    const groupsWithStats = groups?.map(group => ({
      ...group,
      active_members: group.group_members?.filter((m: any) => m.status === 'active').length || 0,
      total_members: group.group_members?.length || 0
    }));

    return createSuccessResponse({
      groups: groupsWithStats || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Admin get groups error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}