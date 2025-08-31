import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const updateProfileSchema = z.object({
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  date_of_birth: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      return createErrorResponse('Profile not found', 404);
    }

    return createSuccessResponse({ user: profile });

  } catch (error) {
    console.error('Get profile error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createErrorResponse('Authentication required', 401);
    }

    const body = await request.json();
    const updates = updateProfileSchema.parse(body);

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to update profile', 400);
    }

    return createSuccessResponse(data, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    return createErrorResponse('Internal server error', 500);
  }
}