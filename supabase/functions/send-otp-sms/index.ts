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

const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendBulkSms = async (phone: string, message: string): Promise<boolean> => {
  const username = Deno.env.get('BULKSMS_USERNAME');
  const password = Deno.env.get('BULKSMS_PASSWORD');
  
  if (!username || !password) {
    console.error('BulkSMS credentials not configured');
    return false;
  }

  try {
    const auth = btoa(`${username}:${password}`);
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phone.startsWith('+') ? phone : `+351${phone}`,
        body: message,
        from: 'KIXIKILA'
      })
    });

    const result = await response.json();
    console.log('BulkSMS response:', result);
    
    return response.ok;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
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

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Generate OTP code
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get user_id from phone number
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();

    // Store OTP in database
    const { error: insertError } = await supabase
      .from('otp_codes')
      .insert({
        user_id: userData?.id || null,
        code: otpCode,
        type: type,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
        attempts: 0,
        max_attempts: 3
      });

    if (insertError) {
      console.error('Error storing OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store OTP' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send SMS
    const message = `KIXIKILA: O seu código de verificação é: ${otpCode}. Válido por 10 minutos.`;
    const smsSuccess = await sendBulkSms(phone, message);

    if (!smsSuccess) {
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`OTP sent successfully to ${phone}, code: ${otpCode}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        expires_in: 600 // 10 minutes in seconds
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