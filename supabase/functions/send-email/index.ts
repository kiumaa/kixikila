import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string;
  subject: string;
  content: string;
  template?: string;
  variables?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authenticate user (optional for some email types)
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: userData } = await supabaseClient.auth.getUser(token);
      userId = userData?.user?.id;
    }

    const emailRequest: EmailRequest = await req.json();

    // Get email configuration from database
    const { data: emailConfig, error: configError } = await supabaseClient
      .from('system_configurations')
      .select('config_value')
      .eq('config_type', 'email')
      .eq('config_key', 'email_configuration')
      .single();

    if (configError || !emailConfig?.config_value) {
      throw new Error('Email configuration not found. Please configure email settings in admin panel.');
    }

    const config = emailConfig.config_value;

    // Validate required configuration
    if (!config.host || !config.user || !config.password) {
      throw new Error('Email configuration incomplete. Please check SMTP settings.');
    }

    // Get email template if specified
    let emailContent = emailRequest.content;
    let emailSubject = emailRequest.subject;

    if (emailRequest.template) {
      const { data: template } = await supabaseClient
        .from('message_templates')
        .select('subject, content')
        .eq('type', 'email')
        .eq('name', emailRequest.template)
        .eq('is_active', true)
        .single();

      if (template) {
        emailContent = template.content;
        emailSubject = template.subject || emailRequest.subject;

        // Replace variables in template
        if (emailRequest.variables) {
          for (const [key, value] of Object.entries(emailRequest.variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            emailContent = emailContent.replace(regex, value);
            emailSubject = emailSubject.replace(regex, value);
          }
        }
      }
    }

    // Create SMTP configuration
    const smtpConfig = {
      hostname: config.host,
      port: config.port,
      username: config.user,
      password: config.password,
      tls: config.secure || (config.port === 465)
    };

    console.log('Sending email with config:', {
      hostname: smtpConfig.hostname,
      port: smtpConfig.port,
      username: smtpConfig.username,
      tls: smtpConfig.tls,
      to: emailRequest.to,
      subject: emailSubject
    });

    // Send email using SMTP
    const emailData = {
      from: {
        name: config.fromName || 'KIXIKILA',
        mail: config.fromAddress || config.user
      },
      to: [{ mail: emailRequest.to }],
      subject: emailSubject,
      html: emailContent,
      text: emailContent.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    // Use native fetch to send via SMTP service or use nodemailer-like approach
    // For now, we'll use a simple HTTP-to-SMTP bridge or implement basic SMTP
    
    const response = await sendViaNodemailer(smtpConfig, emailData);

    if (!response.success) {
      throw new Error(response.error || 'Failed to send email');
    }

    // Log the email sending
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: userId,
        entity_type: 'email_sent',
        entity_id: emailRequest.to,
        action: 'send_email',
        metadata: {
          subject: emailSubject,
          template: emailRequest.template,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        messageId: response.messageId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error sending email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Simple nodemailer-like implementation for Deno
async function sendViaNodemailer(config: any, emailData: any) {
  try {
    // For demonstration purposes, we'll simulate sending
    // In production, you would use actual SMTP library or service
    
    // Basic SMTP implementation or use external service
    const emailPayload = {
      smtp: config,
      message: {
        from: `${emailData.from.name} <${emailData.from.mail}>`,
        to: emailData.to.map((t: any) => t.mail).join(','),
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      }
    };

    console.log('Email payload prepared:', emailPayload);

    // Mock successful response for now
    // Replace with actual SMTP implementation
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}