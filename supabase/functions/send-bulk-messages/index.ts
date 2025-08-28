import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BulkMessageRequest {
  campaignId: string;
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const bulkSmsUsername = Deno.env.get('BULKSMS_USERNAME');
const bulkSmsPassword = Deno.env.get('BULKSMS_PASSWORD');
const resendApiKey = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaignId }: BulkMessageRequest = await req.json();

    console.log('Processing bulk message campaign:', campaignId);

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('bulk_campaigns')
      .select(`
        *,
        template:message_templates(*)
      `)
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error(`Campaign not found: ${campaignError?.message}`);
    }

    console.log('Campaign loaded:', campaign.name);

    // Get recipients based on campaign filters
    const recipients = await getRecipients(campaign.target_audience, campaign.filters);
    
    if (recipients.length === 0) {
      throw new Error('No recipients found for this campaign');
    }

    console.log(`Found ${recipients.length} recipients`);

    // Process messages in batches
    const batchSize = 100;
    let sent = 0;
    let delivered = 0;
    let failed = 0;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const batchResults = await Promise.allSettled(
        batch.map(recipient => sendMessage(campaign, recipient))
      );

      // Count results
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          sent++;
          if (result.value.success) {
            delivered++;
          } else {
            failed++;
          }
        } else {
          sent++;
          failed++;
        }
      });

      // Update campaign progress
      await supabase
        .from('bulk_campaigns')
        .update({
          sent_count: sent,
          delivered_count: delivered,
          failed_count: failed
        })
        .eq('id', campaignId);

      // Add delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Mark campaign as completed
    await supabase
      .from('bulk_campaigns')
      .update({
        status: failed > sent * 0.5 ? 'failed' : 'completed',
        sent_count: sent,
        delivered_count: delivered,
        failed_count: failed
      })
      .eq('id', campaignId);

    console.log(`Campaign completed: ${delivered}/${sent} messages delivered`);

    return new Response(JSON.stringify({
      success: true,
      campaignId,
      totalSent: sent,
      totalDelivered: delivered,
      totalFailed: failed
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-bulk-messages function:", error);
    
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

// Get recipients based on campaign targeting
async function getRecipients(audience: string, filters: any) {
  let query = supabase
    .from('users')
    .select('id, email, phone, full_name, is_vip, country, kyc_status, last_login')
    .eq('is_active', true);

  // Apply audience filters
  if (audience === 'vip') {
    query = query.eq('is_vip', true);
  } else if (audience === 'inactive') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query = query.lt('last_login', thirtyDaysAgo.toISOString());
  }

  // Apply advanced filters
  if (filters) {
    if (filters.user_types && filters.user_types.length > 0) {
      if (filters.user_types.includes('vip')) {
        query = query.eq('is_vip', true);
      } else if (filters.user_types.includes('free')) {
        query = query.eq('is_vip', false);
      }
    }

    if (filters.countries && filters.countries.length > 0) {
      query = query.in('country', filters.countries);
    }

    if (filters.kyc_status && filters.kyc_status.length > 0) {
      query = query.in('kyc_status', filters.kyc_status);
    }

    if (filters.last_login_days) {
      const date = new Date();
      date.setDate(date.getDate() - filters.last_login_days);
      query = query.lt('last_login', date.toISOString());
    }
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching recipients:', error);
    return [];
  }

  return data || [];
}

// Send individual message
async function sendMessage(campaign: any, recipient: any): Promise<{ success: boolean; error?: string }> {
  try {
    const template = campaign.template;
    
    // Replace template variables
    let content = template.content;
    const variables = {
      'user.name': recipient.full_name || 'Utilizador',
      'user.email': recipient.email,
      'campaign.name': campaign.name,
      'date': new Date().toLocaleDateString('pt-PT')
    };

    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
    });

    if (campaign.type === 'sms') {
      return await sendSMS(recipient.phone, content);
    } else if (campaign.type === 'email') {
      const subject = template.subject || campaign.name;
      const processedSubject = Object.entries(variables).reduce((subj, [key, value]) => 
        subj.replace(new RegExp(`\\{${key}\\}`, 'g'), value || ''), subject
      );
      return await sendEmail(recipient.email, processedSubject, content);
    }

    return { success: false, error: 'Unsupported message type' };

  } catch (error: any) {
    console.error('Error sending message:', error);
    return { success: false, error: error.message };
  }
}

// Send SMS via BulkSMS
async function sendSMS(phoneNumber: string, message: string): Promise<{ success: boolean; error?: string }> {
  if (!bulkSmsUsername || !bulkSmsPassword) {
    return { success: false, error: 'BulkSMS credentials not configured' };
  }

  try {
    const response = await fetch('https://api.bulksms.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${bulkSmsUsername}:${bulkSmsPassword}`)}`
      },
      body: JSON.stringify({
        to: phoneNumber,
        body: message,
        from: 'KIXIKILA'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`BulkSMS API error: ${error}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
}

// Send Email via Resend
async function sendEmail(email: string, subject: string, content: string): Promise<{ success: boolean; error?: string }> {
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
        subject,
        text: content,
        html: content.replace(/\n/g, '<br>')
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    return { success: true };

  } catch (error: any) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}

serve(handler);