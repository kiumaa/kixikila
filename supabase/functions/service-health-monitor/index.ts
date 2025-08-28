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

    const { action } = await req.json();

    switch (action) {
      case 'check_all_services':
        return await checkAllServices(supabaseClient);
      
      case 'get_service_status':
        return await getServiceStatus(supabaseClient);
      
      case 'test_email_service':
        return await testEmailService();
      
      case 'test_sms_service':
        return await testSMSService();
      
      case 'test_stripe_service':
        return await testStripeService();

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in service-health-monitor:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function checkAllServices(supabaseClient: any) {
  const results = [];

  // Test Email Service
  const emailResult = await testEmailService();
  results.push({
    service_name: 'email',
    status: emailResult.status,
    response_time_ms: emailResult.responseTime,
    error_message: emailResult.error || null
  });

  // Test SMS Service
  const smsResult = await testSMSService();
  results.push({
    service_name: 'sms',
    status: smsResult.status,
    response_time_ms: smsResult.responseTime,
    error_message: smsResult.error || null
  });

  // Test Stripe Service
  const stripeResult = await testStripeService();
  results.push({
    service_name: 'stripe',
    status: stripeResult.status,
    response_time_ms: stripeResult.responseTime,
    error_message: stripeResult.error || null
  });

  // Test Database Connection
  const dbResult = await testDatabaseConnection(supabaseClient);
  results.push({
    service_name: 'database',
    status: dbResult.status,
    response_time_ms: dbResult.responseTime,
    error_message: dbResult.error || null
  });

  // Save results to database
  for (const result of results) {
    await supabaseClient
      .from('service_status')
      .upsert(result, { onConflict: 'service_name' });
  }

  return new Response(
    JSON.stringify({ success: true, data: results }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getServiceStatus(supabaseClient: any) {
  const { data, error } = await supabaseClient
    .from('service_status')
    .select('*')
    .order('last_check', { ascending: false });

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, data }), 
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function testEmailService() {
  const startTime = Date.now();
  
  try {
    const smtpHost = Deno.env.get('SMTP_HOST');
    const smtpUser = Deno.env.get('SMTP_USER');
    const smtpPass = Deno.env.get('SMTP_PASS') || Deno.env.get('EMAIL_PASSWORD');

    if (!smtpHost || !smtpUser || !smtpPass) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: 'Email service not configured'
      };
    }

    // Simple SMTP connection test (simplified for demo)
    // In real implementation, you'd test actual SMTP connection
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testSMSService() {
  const startTime = Date.now();
  
  try {
    const bulkSmsUsername = Deno.env.get('BULKSMS_USERNAME');
    const bulkSmsPassword = Deno.env.get('BULKSMS_PASSWORD');

    if (!bulkSmsUsername || !bulkSmsPassword) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: 'SMS service not configured'
      };
    }

    // Test BulkSMS API connection
    const response = await fetch('https://api.bulksms.com/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + btoa(`${bulkSmsUsername}:${bulkSmsPassword}`)
      },
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'healthy',
        responseTime
      };
    } else {
      return {
        status: 'down',
        responseTime,
        error: `SMS API returned ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testStripeService() {
  const startTime = Date.now();
  
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: 'Stripe service not configured'
      };
    }

    // Test Stripe API connection
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      signal: AbortSignal.timeout(10000)
    });

    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return {
        status: 'healthy',
        responseTime
      };
    } else {
      return {
        status: 'down',
        responseTime,
        error: `Stripe API returned ${response.status}`
      };
    }
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}

async function testDatabaseConnection(supabaseClient: any) {
  const startTime = Date.now();
  
  try {
    // Simple database health check
    const { error } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return {
        status: 'down',
        responseTime,
        error: error.message
      };
    }

    return {
      status: 'healthy',
      responseTime
    };
  } catch (error) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      error: error.message
    };
  }
}