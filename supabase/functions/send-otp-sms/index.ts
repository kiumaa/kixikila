import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OTPRequest {
  phone: string;
  type?: 'login' | 'register';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone, type = 'login' }: OTPRequest = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists or create one for registration
    let user_id: string;
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
    
    if (existingUser) {
      user_id = existingUser.id;
    } else if (type === 'register') {
      // Create new user for registration
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone,
          full_name: `User ${phone}`,
          phone_verified: false,
          is_active: true
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('User creation error:', createError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      user_id = newUser.id;
    } else {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate OTP - Fixed code "123456" for development
    const otp_code = "123456"; // Fixed development code
    const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabase
      .from('otp_codes')
      .insert({
        user_id,
        code: otp_code,
        type,
        expires_at: expires_at.toISOString(),
        status: 'pending'
      });

    if (otpError) {
      console.error('OTP storage error:', otpError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DEVELOPMENT MODE: SMS disabled, using fixed code
    console.log(`🔐 DESENVOLVIMENTO - Código fixo para ${phone}: ${otp_code}`);
    console.log(`📱 Use sempre o código: 123456`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '📱 DESENVOLVIMENTO: Use sempre o código 123456',
        phone: phone.slice(0, 3) + '****' + phone.slice(-2), // Masked phone
        developmentMode: true,
        code: otp_code // Show code in development
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Send OTP error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);