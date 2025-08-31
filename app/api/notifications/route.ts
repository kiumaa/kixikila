import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const getNotificationsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  unread_only: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const url = new URL(request.url);
    const { page = '1', limit = '20', unread_only } = 
      getNotificationsSchema.parse(Object.fromEntries(url.searchParams));

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (unread_only === 'true') {
      query = query.eq('read', false);
    }

    const { data: notifications, error, count } = await query;

    if (error) {
      throw error;
    }

    return createSuccessResponse({
      notifications: notifications || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
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
    const { notification_ids, mark_as_read } = body;

    if (!notification_ids || !Array.isArray(notification_ids)) {
      return createErrorResponse('notification_ids is required and must be an array', 400);
    }

    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: mark_as_read === true,
        updated_at: new Date().toISOString()
      })
      .in('id', notification_ids)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return createSuccessResponse(
      null, 
      `Notifications ${mark_as_read ? 'marked as read' : 'marked as unread'}`
    );

  } catch (error) {
    console.error('Update notifications error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}