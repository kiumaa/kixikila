import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendOtpRequest {
  phone: string;
  type: 'phone_verification' | 'login';
}

// Send OTP using Twilio Verify API with enhanced error handling  
const sendTwilioOtp = async (phone: string): Promise<{ success: boolean; sid?: string; error?: string }> => {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const verifyServiceSid = Deno.env.get('TWILIO_VERIFY_SERVICE_SID');
  
  console.log('🔐 Checking Twilio credentials:', {
    accountSid: accountSid ? 'configured' : '❌ MISSING',
    authToken: authToken ? 'configured' : '❌ MISSING',  
    verifyServiceSid: verifyServiceSid ? 'configured' : '❌ MISSING'
  });
  
  if (!accountSid || !authToken || !verifyServiceSid) {
    console.error('❌ Twilio credentials not properly configured');
    return { 
      success: false, 
      error: 'Serviço de SMS temporariamente indisponível. Contacte o suporte técnico.' 
    };
  }

  try {
    // Accept international phone numbers (must start with +)
    const formattedPhone = phone.startsWith('+') ? phone : `+351${phone}`;
    console.log('📱 Sending OTP to international number:', formattedPhone);
    console.log('🔧 Using Twilio service:', verifyServiceSid);
    
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          To: formattedPhone,
          Channel: 'sms'
        })
      }
    );

    const result = await response.json();
    console.log('📋 Twilio response status:', response.status);
    console.log('📋 Twilio response body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.status === 'pending') {
      console.log('✅ OTP sent successfully, SID:', result.sid);
      return { success: true, sid: result.sid };
    } else {
      console.error('❌ Twilio API error:', result);
      
      // Handle specific Twilio errors
      if (result.code === 20404 || result.message?.includes('not found')) {
        console.error('🚨 Twilio service not found - check TWILIO_VERIFY_SERVICE_SID:', verifyServiceSid);
        return { 
          success: false, 
          error: 'Serviço de verificação não encontrado. Contacte o suporte técnico.' 
        };
      } else if (result.code === 20003 || result.code === 20401) {
        console.error('🚨 Twilio authentication failed - check credentials');
        return { 
          success: false, 
          error: 'Credenciais inválidas. Contacte o suporte técnico.' 
        };
      } else if (result.code === 60200) {
        return { 
          success: false, 
          error: 'Demasiadas tentativas. Aguarde alguns minutos antes de tentar novamente.' 
        };
      } else if (result.code === 21211) {
        return { 
          success: false, 
          error: 'Número de telefone inválido. Verifique o formato e tente novamente.' 
        };
      } else {
        const errorMsg = result.message || result.error_message || 'Erro desconhecido';
        console.error('🔍 Unhandled Twilio error:', { code: result.code, message: errorMsg });
        return { 
          success: false, 
          error: `Erro ao enviar SMS: ${errorMsg}` 
        };
      }
    }
  } catch (error) {
    console.error('💥 Network/fetch error sending Twilio OTP:', error);
    return { 
      success: false, 
      error: 'Erro de rede. Verifique sua conexão e tente novamente.' 
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, type }: SendOtpRequest = await req.json();

    if (!phone || !type) {
      return new Response(
        JSON.stringify({ error: 'Phone number and type are required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Send OTP via Twilio Verify
    const twilioResult = await sendTwilioOtp(phone);

    if (!twilioResult.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: twilioResult.error || 'Failed to send OTP' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Store OTP verification attempt in our database for tracking
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get user_id from phone number if exists
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('phone', phone)
      .single();

    // Store verification attempt in database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: userData?.id || null,
        code: twilioResult.sid, // Store Twilio verification SID instead of actual code
        type: type,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      });

    if (insertError) {
      console.error('Error storing OTP record:', insertError);
      // Continue anyway, Twilio has the verification
    }

    console.log(`Twilio OTP sent successfully to ${phone}, SID: ${twilioResult.sid}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP enviado com sucesso',
        expires_in: 10 * 60 // 10 minutes in seconds
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-otp-sms function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});