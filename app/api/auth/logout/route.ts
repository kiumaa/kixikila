import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Sign out with specific token
      await supabase.auth.admin.signOut(token);
    }

    return NextResponse.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}