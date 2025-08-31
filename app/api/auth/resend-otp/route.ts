import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const resendOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(['signup', 'recovery'])
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, type } = resendOtpSchema.parse(body);

    // Resend OTP with Supabase Auth
    const { data, error } = await supabase.auth.resend({
      type,
      email
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'OTP resent successfully',
      data
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}