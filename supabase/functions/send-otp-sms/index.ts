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

// Replace template variables with actual values
function processTemplate(template: string, variables: Record<string, any>): string {
  let processed = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    processed = processed.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value.toString());
  }
  return processed;
}

// Get SMS configuration from system settings
async function getSMSConfiguration(supabase: any) {
  try {
    // Get SMS configuration
    const { data: smsData } = await supabase
      .from('system_configurations')
      .select('*')
      .eq('config_type', 'sms')
      .single();

    // Get SMS templates
    const { data: templatesData } = await supabase
      .from('message_templates')
      .select('*')
      .eq('type', 'sms')
      .eq('is_active', true);

    // Process templates
    const templates: any = {};
    templatesData?.forEach((template: any) => {
      if (template.category) {
        templates[template.category] = template.content;
      }
    });

    // Default configuration
    const defaultConfig = {
      senderId: 'KB Agency',
      brandName: 'KIXIKILA',
      templates: {
        otp: '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.',
        reminder: '{{brandName}}: Lembrete de pagamento. Código: {{code}}. Se não foi você, ignore esta mensagem.'
      },
      otpExpiry: 10
    };

    return smsData?.config_value ? 
      { ...defaultConfig, ...smsData.config_value, templates } : 
      { ...defaultConfig, templates };
  } catch (error) {
    console.error('Error getting SMS configuration:', error);
    return {
      senderId: 'KB Agency',
      brandName: 'KIXIKILA',
      templates: {
        otp: '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.',
        reminder: '{{brandName}}: Lembrete de pagamento. Código: {{code}}. Se não foi você, ignore esta mensagem.'
      },
      otpExpiry: 10
    };
  }
}

const generateOtpCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendBulkSms = async (phone: string, message: string, senderId?: string): Promise<boolean> => {
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
        from: senderId || 'KIXIKILA'
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

    // Get SMS configuration
    const smsConfig = await getSMSConfiguration(supabase);

    // Generate OTP code
    const otpCode = generateOtpCode();
    const expiryMinutes = smsConfig.otpExpiry || 10;
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Get user_id from phone number
    const { data: userData } = await supabase
      .from('users')
      .select('id, full_name')
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

    // Prepare SMS message using template
    const templateKey = type === 'phone_verification' ? 'otp' : 'reminder';
    const template = smsConfig.templates?.[templateKey] || smsConfig.templates?.otp || '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.';
    
    const variables = {
      brandName: smsConfig.brandName || 'KIXIKILA',
      code: otpCode,
      minutes: expiryMinutes,
      userName: userData?.full_name || '',
      phone: phone
    };
    
    const message = processTemplate(template, variables);

    // Send SMS
    const smsSuccess = await sendBulkSms(phone, message, smsConfig.senderId);

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
        expires_in: expiryMinutes * 60 // seconds
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