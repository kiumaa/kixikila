import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyOtpRequest {
  phone?: string;
  email?: string;
  code: string;
  type: 'phone_verification' | 'email_verification' | 'login';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, email, code, type }: VerifyOtpRequest = await req.json();

    if (!code || !type) {
      return new Response(
        JSON.stringify({ error: 'Code and type are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!phone && !email) {
      return new Response(
        JSON.stringify({ error: 'Phone or email is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find user by phone or email
    let userData = null;
    if (phone) {
      const { data } = await supabase
        .from('users')
        .select('id, phone, phone_verified')
        .eq('phone', phone)
        .single();
      userData = data;
    } else if (email) {
      const { data } = await supabase
        .from('users')
        .select('id, email, email_verified')
        .eq('email', email)
        .single();
      userData = data;
    }

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the OTP record
    const { data: otpData, error: otpError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userData.id)
      .eq('code', code)
      .eq('type', type)
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired OTP code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if max attempts exceeded
    if (otpData.attempts >= otpData.max_attempts) {
      return new Response(
        JSON.stringify({ error: 'Maximum verification attempts exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark OTP as verified
    const { error: updateOtpError } = await supabase
      .from('otp_codes')
      .update({
        status: 'verified',
        verified_at: new Date().toISOString(),
        attempts: otpData.attempts + 1
      })
      .eq('id', otpData.id);

    if (updateOtpError) {
      console.error('Error updating OTP:', updateOtpError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update user verification status
    let updateUserData: any = {};
    if (type === 'phone_verification' && phone) {
      updateUserData.phone_verified = true;
    } else if (type === 'email_verification' && email) {
      updateUserData.email_verified = true;
    }

    if (Object.keys(updateUserData).length > 0) {
      const { error: updateUserError } = await supabase
        .from('users')
        .update(updateUserData)
        .eq('id', userData.id);

      if (updateUserError) {
        console.error('Error updating user verification status:', updateUserError);
      }
    }

    console.log(`OTP verified successfully for user ${userData.id}, type: ${type}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        verified: true,
        user_id: userData.id
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-otp function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});