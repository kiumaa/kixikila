import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6),
  type: z.enum(['signup', 'recovery', 'email_change', 'phone_change'])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, token, type } = verifyOtpSchema.parse(body);

    // Verify OTP with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.verifyOtp({
      email,
      token,
      type
    });

    if (authError) {
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      );
    }

    // Update email verification status if signup
    if (type === 'signup' && authData.user) {
      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', authData.user.id);
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        user: authData.user,
        session: authData.session
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}