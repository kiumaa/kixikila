import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const updateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  contribution_amount: z.number().positive().optional(),
  max_members: z.number().int().min(2).max(50).optional(),
  is_private: z.boolean().optional(),
  requires_approval: z.boolean().optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional()
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { id } = params;

    // Get group with member details
    const { data: group, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (
          id,
          user_id,
          role,
          status,
          total_contributed,
          current_balance,
          payout_position,
          users (
            id,
            full_name,
            avatar_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      return createErrorResponse('Group not found', 404);
    }

    // Check if user has access to this group
    const userIsMember = group.group_members?.some(
      (member: any) => member.user_id === user.id
    );

    if (!userIsMember && group.is_private) {
      return createErrorResponse('Access denied', 403);
    }

    return createSuccessResponse(group);

  } catch (error) {
    console.error('Get group error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { id } = params;
    const body = await request.json();
    const updates = updateGroupSchema.parse(body);

    // Check if user is group admin/creator
    const { data: membership } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', id)
      .eq('user_id', user.id)
      .single();

    if (!membership || !['creator', 'admin'].includes(membership.role)) {
      return createErrorResponse('Permission denied', 403);
    }

    const { data: group, error } = await supabase
      .from('groups')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return createSuccessResponse(group, 'Group updated successfully');

  } catch (error) {
    console.error('Update group error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { id } = params;

    // Check if user is group creator
    const { data: group } = await supabase
      .from('groups')
      .select('creator_id, status')
      .eq('id', id)
      .single();

    if (!group || group.creator_id !== user.id) {
      return createErrorResponse('Permission denied', 403);
    }

    if (group.status === 'active') {
      return createErrorResponse('Cannot delete active group', 400);
    }

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return createSuccessResponse(null, 'Group deleted successfully');

  } catch (error) {
    console.error('Delete group error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}