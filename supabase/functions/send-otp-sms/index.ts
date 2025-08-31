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

    // Generate random 6-digit OTP
    const otp_code = Math.floor(100000 + Math.random() * 900000).toString();
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

    // Send SMS via BulkSMS API
    const smsResult = await sendSMS(phone, `Seu código KIXIKILA: ${otp_code}. Válido por 10 minutos.`);
    
    if (!smsResult.success) {
      console.error('SMS sending failed:', smsResult.error);
      return new Response(
        JSON.stringify({ error: 'Failed to send SMS' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📱 SMS enviado para ${phone}: ${smsResult.messageId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código SMS enviado com sucesso',
        phone: phone.slice(0, 3) + '****' + phone.slice(-2), // Masked phone
        messageId: smsResult.messageId
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

// Function to send SMS via BulkSMS API
async function sendSMS(phone: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const tokenId = Deno.env.get('BULKSMS_TOKEN_ID');
    const tokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');

    if (!tokenId || !tokenSecret) {
      return { success: false, error: 'BulkSMS credentials not configured' };
    }

    // Format phone number for international format
    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    const smsData = {
      to: formattedPhone,
      body: message,
      from: "KIXIKILA"
    };

    const authHeader = 'Basic ' + btoa(`${tokenId}:${tokenSecret}`);

    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(smsData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BulkSMS API error:', response.status, errorText);
      return { success: false, error: `BulkSMS API error: ${response.status}` };
    }

    const result = await response.json();
    console.log('BulkSMS response:', result);
    
    return { 
      success: true, 
      messageId: result[0]?.id || 'unknown'
    };
  } catch (error) {
    console.error('SMS sending error:', error);
    return { success: false, error: error.message };
  }
}

serve(handler);