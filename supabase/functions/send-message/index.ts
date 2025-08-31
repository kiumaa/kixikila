import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendMessageRequest {
  type: 'sms' | 'email';
  recipient: string;
  templateId: string;
  variables: Record<string, any>;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const bulkSmsTokenId = Deno.env.get('BULKSMS_TOKEN_ID');
const bulkSmsTokenSecret = Deno.env.get('BULKSMS_TOKEN_SECRET');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipient, templateId, variables }: SendMessageRequest = await req.json();

    console.log('Sending message:', { type, recipient, templateId });

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', templateId)
      .eq('is_active', true)
      .single();

    if (templateError || !template) {
      throw new Error(`Template not found: ${templateError?.message}`);
    }

    // Process template content
    let content = template.content;
    let subject = template.subject || '';

    // Replace variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      content = content.replace(regex, String(value || ''));
      if (subject) {
        subject = subject.replace(regex, String(value || ''));
      }
    });

    let result;
    if (type === 'sms') {
      result = await sendSMS(recipient, content);
    } else if (type === 'email') {
      result = await sendEmail(recipient, subject, content);
    } else {
      throw new Error('Unsupported message type');
    }

    // Log the message
    await supabase
      .from('message_logs')
      .insert({
        type,
        recipient,
        template_id: templateId,
        content: content.substring(0, 1000), // Store first 1000 chars
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        sent_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({
      success: result.success,
      messageId: result.messageId,
      error: result.error
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-message function:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json", 
        ...corsHeaders 
      },
    });
  }
};

// Send SMS via BulkSMS
async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!bulkSmsTokenId || !bulkSmsTokenSecret) {
    return { success: false, error: 'BulkSMS credentials not configured' };
  }

  try {
    // Clean and format phone number for international format
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    let formattedPhone = cleanPhone;
    
    // Add country code if not present
    if (!cleanPhone.startsWith('244')) {
      formattedPhone = `244${cleanPhone}`;
    }
    
    // Add + prefix for international format
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+${formattedPhone}`;
    }

    const authHeader = 'Basic ' + btoa(`${bulkSmsTokenId}:${bulkSmsTokenSecret}`);

    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        to: formattedPhone,
        body: message,
        from: 'KIXIKILA',
        encoding: 'UNICODE'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BulkSMS API error:', response.status, errorText);
      throw new Error(`BulkSMS API error: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('BulkSMS response:', responseData);

    return { 
      success: true, 
      messageId: responseData[0]?.id || responseData.id || 'unknown'
    };

  } catch (error: any) {
    console.error('SMS sending failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Send Email via Resend
async function sendEmail(email: string, subject: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!resendApiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'KIXIKILA <noreply@kixikila.pro>',
        to: [email],
        subject: subject || 'Mensagem KIXIKILA',
        text: content,
        html: content.replace(/\n/g, '<br>'),
        tags: [{
          name: 'category',
          value: 'notification'
        }]
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(`Resend API error: ${responseData.message || 'Unknown error'}`);
    }

    return { 
      success: true, 
      messageId: responseData.id 
    };

  } catch (error: any) {
    console.error('Email sending failed:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

serve(handler);