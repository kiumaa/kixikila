import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: userProfile } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (!userProfile || userProfile.role !== 'admin') {
      throw new Error('Admin access required');
    }

    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'get_all_configs':
        return await getAllConfigurations(supabaseClient);
      
      case 'get_system_config':
        return await getSystemConfig(supabaseClient, requestData);
      
      case 'update_system_config':
        return await updateSystemConfiguration(supabaseClient, requestData);
      
      case 'get_templates':
        return await getMessageTemplates(supabaseClient, requestData);
      
      case 'update_template':
        return await updateMessageTemplate(supabaseClient, requestData);
      
      case 'create_template':
        return await createMessageTemplate(supabaseClient, requestData);
      
      case 'get_sms_config':
        return await getSMSConfiguration(supabaseClient);
      
      case 'update_sms_configuration':
        return await updateSMSConfiguration(supabaseClient, requestData);
      
      case 'get_security_config':
        return await getSecurityConfiguration(supabaseClient);
      
      case 'update_security_config':
        return await updateSecurityConfiguration(supabaseClient, requestData);
      
      case 'get_notification_config':
        return await getNotificationConfiguration(supabaseClient);
      
      case 'update_notification_config':
        return await updateNotificationConfiguration(supabaseClient, requestData);
      
      case 'get_webhooks':
        return await getWebhooks(supabaseClient);
      
      case 'create_webhook':
        return await createWebhook(supabaseClient, requestData);
      
      case 'update_webhook':
        return await updateWebhook(supabaseClient, requestData);
      
      case 'delete_webhook':
        return await deleteWebhook(supabaseClient, requestData);

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-system-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function getAllConfigurations(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('system_configurations')
    .select('*')
    .order('config_type', { ascending: true });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSystemConfig(supabaseClient: any, requestData: any) {
  const { config_type } = requestData;
  
  let query = supabaseClient.from('system_configurations').select('*');
  
  if (config_type) {
    query = query.eq('config_type', config_type);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateSystemConfiguration(supabaseClient: any, requestData: any) {
  const { config_key, config_value, config_type, description } = requestData;

  const { data, error } = await supabaseClient
    .from('system_configurations')
    .upsert({
      config_key,
      config_value,
      config_type,
      description
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMessageTemplates(supabaseClient: any, requestData: any) {
  const { type, category } = requestData;
  
  let query = supabaseClient.from('message_templates').select('*');
  
  if (type) query = query.eq('type', type);
  if (category) query = query.eq('category', category);
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createMessageTemplate(supabaseClient: any, requestData: any) {
  const { name, type, category, subject, content, variables, language = 'pt' } = requestData;

  const { data, error } = await supabaseClient
    .from('message_templates')
    .insert({
      name,
      type,
      category,
      subject,
      content,
      variables,
      language
    })
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateMessageTemplate(supabaseClient: any, requestData: any) {
  const { id, ...updates } = requestData;

  const { data, error } = await supabaseClient
    .from('message_templates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// SMS Configuration Functions
async function getSMSConfiguration(supabaseClient: any) {
  try {
    // Get basic SMS configuration
    const { data: smsData, error: smsError } = await supabaseClient
      .from('system_configurations')
      .select('*')
      .eq('config_type', 'sms')
      .single();

    if (smsError && smsError.code !== 'PGRST116') {
      throw smsError;
    }

    // Get SMS templates
    const { data: templatesData, error: templatesError } = await supabaseClient
      .from('message_templates')
      .select('*')
      .eq('type', 'sms')
      .eq('is_active', true);

    if (templatesError) {
      throw templatesError;
    }

    // Process templates into the expected format
    const templates: any = {};
    templatesData?.forEach((template: any) => {
      if (template.category) {
        templates[template.category] = template.content;
      }
    });

    // Default configuration if none exists
    const defaultConfig = {
      senderId: 'KB Agency',
      brandName: 'KIXIKILA',
      allowedCountries: ['PT', 'BR'],
      templates: {
        otp: '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.',
        reminder: '{{brandName}}: Lembrete de pagamento. Código: {{code}}. Se não foi você, ignore esta mensagem.'
      },
      rateLimits: {
        perPhone: 5,
        global: 100
      },
      otpExpiry: 10,
      security: {
        blockInternational: false,
        enableBlacklist: false,
        requirePhoneVerification: true
      },
      delivery: {
        allowedTimeStart: '08:00',
        allowedTimeEnd: '22:00',
        maxRetries: 3,
        allowedDays: [0, 1, 2, 3, 4, 5, 6]
      }
    };

    // Merge with existing configuration
    const config = smsData?.config_value ? { ...defaultConfig, ...smsData.config_value, templates } : { ...defaultConfig, templates };

    return new Response(
      JSON.stringify(config), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error getting SMS configuration:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function updateSMSConfiguration(supabaseClient: any, requestData: any) {
  try {
    const { config } = requestData;
    
    if (!config) {
      throw new Error('Configuration data is required');
    }

    // Extract templates from config
    const { templates, ...smsConfig } = config;

    // Update main SMS configuration
    const { error: configError } = await supabaseClient
      .from('system_configurations')
      .upsert({
        config_type: 'sms',
        config_key: 'sms_configuration',
        config_value: smsConfig,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'config_key'
      });

    if (configError) {
      throw configError;
    }

    // Update templates if provided
    if (templates) {
      for (const [category, content] of Object.entries(templates)) {
        if (content && typeof content === 'string') {
          // Check if template exists
          const { data: existingTemplate } = await supabaseClient
            .from('message_templates')
            .select('id')
            .eq('type', 'sms')
            .eq('category', category)
            .single();

          if (existingTemplate) {
            // Update existing template
            const { error: updateError } = await supabaseClient
              .from('message_templates')
              .update({
                content: content,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingTemplate.id);

            if (updateError) {
              throw updateError;
            }
          } else {
            // Create new template
            const { error: insertError } = await supabaseClient
              .from('message_templates')
              .insert({
                type: 'sms',
                category: category,
                name: `SMS ${category} template`,
                content: content,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) {
              throw insertError;
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'SMS configuration updated successfully' }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating SMS configuration:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

// Keep the original function as well for backward compatibility
async function getSMSConfiguration_old(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('sms_configurations')
    .select(`
      *,
      default_template_otp:message_templates!sms_configurations_default_template_otp_fkey(*),
      default_template_notification:message_templates!sms_configurations_default_template_notification_fkey(*)
    `)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return new Response(
    JSON.stringify({ success: true, data: data || {} }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Remove the duplicate/old SMS configuration function

async function getSecurityConfiguration(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('security_configurations')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return new Response(
    JSON.stringify({ success: true, data: data || {} }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateSecurityConfiguration(supabaseClient: any, requestData: any) {
  const { data: existing } = await supabaseClient
    .from('security_configurations')
    .select('id')
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabaseClient
      .from('security_configurations')
      .update(requestData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseClient
      .from('security_configurations')
      .insert(requestData)
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  return new Response(
    JSON.stringify({ success: true, data: result }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getNotificationConfiguration(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('notification_configurations')
    .select('*')
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  return new Response(
    JSON.stringify({ success: true, data: data || {} }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateNotificationConfiguration(supabaseClient: any, requestData: any) {
  const { data: existing } = await supabaseClient
    .from('notification_configurations')
    .select('id')
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabaseClient
      .from('notification_configurations')
      .update(requestData)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    result = data;
  } else {
    const { data, error } = await supabaseClient
      .from('notification_configurations')
      .insert(requestData)
      .select()
      .single();
    if (error) throw error;
    result = data;
  }

  return new Response(
    JSON.stringify({ success: true, data: result }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getWebhooks(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('webhook_configurations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function createWebhook(supabaseClient: any, requestData: any) {
  const { data, error } = await supabaseClient
    .from('webhook_configurations')
    .insert(requestData)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateWebhook(supabaseClient: any, requestData: any) {
  const { id, ...updates } = requestData;

  const { data, error } = await supabaseClient
    .from('webhook_configurations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteWebhook(supabaseClient: any, requestData: any) {
  const { id } = requestData;

  const { error } = await supabaseClient
    .from('webhook_configurations')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}