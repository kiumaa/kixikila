import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  group_type: z.enum(['savings', 'investment', 'loan']),
  contribution_amount: z.number().positive(),
  max_members: z.number().int().min(2).max(50),
  contribution_frequency: z.string().default('monthly'),
  is_private: z.boolean().default(true),
  requires_approval: z.boolean().default(true)
});

const searchGroupsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const url = new URL(request.url);
    const { page = '1', limit = '10', search, type, status } = 
      searchGroupsSchema.parse(Object.fromEntries(url.searchParams));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    // Get user's groups through group_members table
    let query = supabase
      .from('groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          role,
          status
        )
      `)
      .eq('group_members.user_id', user.id)
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    if (type) {
      query = query.eq('group_type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data: groups, error, count } = await query;

    if (error) {
      throw error;
    }

    return createSuccessResponse({
      groups: groups || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const groupData = createGroupSchema.parse(body);

    // Create group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        ...groupData,
        creator_id: user.id,
        status: 'draft'
      })
      .select()
      .single();

    if (groupError) {
      throw groupError;
    }

    // Add creator as group member
    const { error: memberError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: 'creator',
        status: 'active'
      });

    if (memberError) {
      throw memberError;
    }

    return createSuccessResponse(group, 'Group created successfully');

  } catch (error) {
    console.error('Create group error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}