import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyOTPRequest {
  phone: string;
  code: string;
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

    const { phone, code, type = 'login' }: VerifyOTPRequest = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: 'Phone and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First find user by phone
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
      
    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DEVELOPMENT MODE: Accept fixed code "123456" or verify from database
    let otpData = null;
    
    if (code === "123456") {
      // Development mode - accept fixed code
      console.log(`🔐 DESENVOLVIMENTO - Código fixo aceite para ${phone}`);
      otpData = { id: 'dev-mode', user_id: userData.id }; // Mock OTP data
    } else {
      // Normal verification from database
      const { data: dbOtpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('user_id', userData.id)
        .eq('code', code)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (otpError || !dbOtpData) {
        return new Response(
          JSON.stringify({ error: 'Código inválido ou expirado. Use 123456 para desenvolvimento.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      otpData = dbOtpData;
    }

    // Mark OTP as used (skip for development mode)
    if (otpData.id !== 'dev-mode') {
      await supabase
        .from('otp_codes')
        .update({ status: 'used' })
        .eq('id', otpData.id);
    }

    // Create Supabase auth session for the user
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate session for user using admin auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email || `${userData.phone.replace('+', '')}@temp.kixikila.pt`,
      options: {
        redirectTo: `${req.headers.get('origin')}/dashboard`
      }
    });

    if (authError) {
      console.error('Auth session creation error:', authError);
      // Fallback: still mark user as verified
      await supabase
        .from('users')
        .update({ 
          phone_verified: true,
          last_login: new Date().toISOString()
        })
        .eq('id', userData.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          data: {
            user: {
              id: userData.id,
              phone: userData.phone,
              full_name: userData.full_name,
              role: userData.role,
              is_vip: userData.is_vip
            },
            isNewUser: false
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        phone_verified: true,
        last_login: new Date().toISOString(),
        email: userData.email || `${userData.phone.replace('+', '')}@temp.kixikila.pt`
      })
      .eq('id', userData.id)
      .select()
      .single();
      
    if (updateError) {
      console.error('User update error:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update user' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          user: {
            id: updatedUser.id,
            phone: updatedUser.phone,
            full_name: updatedUser.full_name,
            role: updatedUser.role,
            is_vip: updatedUser.is_vip,
            email: updatedUser.email
          },
          sessionUrl: authUser.properties?.action_link,
          isNewUser: false
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Verify OTP error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);