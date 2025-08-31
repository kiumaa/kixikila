import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    // Get user profile with role
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email,
      role: profile?.role || 'user'
    };
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthUser> {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

export async function requireAdmin(request: NextRequest): Promise<AuthUser> {
  const user = await requireAuth(request);
  if (user.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return user;
}

export function createErrorResponse(message: string, status = 400) {
  return Response.json(
    { success: false, message },
    { status }
  );
}

export function createSuccessResponse(data?: any, message?: string) {
  return Response.json({
    success: true,
    ...(data && { data }),
    ...(message && { message })
  });
}