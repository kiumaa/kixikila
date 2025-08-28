import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  services: {
    database: 'up' | 'down';
    bulksms: 'up' | 'down' | 'not_configured';
    stripe: 'up' | 'down' | 'not_configured';
  };
  metrics: {
    active_users: number;
    pending_otps: number;
    system_load: 'low' | 'medium' | 'high';
  };
}

const checkDatabaseHealth = async (supabase: any): Promise<'up' | 'down'> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    return error ? 'down' : 'up';
  } catch {
    return 'down';
  }
};

const checkBulkSmsHealth = async (): Promise<'up' | 'down' | 'not_configured'> => {
  const username = Deno.env.get('BULKSMS_USERNAME');
  const password = Deno.env.get('BULKSMS_PASSWORD');
  
  if (!username || !password) {
    return 'not_configured';
  }

  try {
    const auth = btoa(`${username}:${password}`);
    const response = await fetch('https://api.bulksms.com/v1/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });

    return response.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
};

const checkStripeHealth = async (): Promise<'up' | 'down' | 'not_configured'> => {
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  
  if (!stripeKey) {
    return 'not_configured';
  }

  try {
    const response = await fetch('https://api.stripe.com/v1/customers?limit=1', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    return response.ok ? 'up' : 'down';
  } catch {
    return 'down';
  }
};

const getMetrics = async (supabase: any) => {
  try {
    // Get active users count (users who logged in last 24h)
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('last_login', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Get pending OTPs count
    const { count: pendingOtps } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
      .gte('expires_at', new Date().toISOString());

    // Simple system load calculation based on pending OTPs
    let systemLoad: 'low' | 'medium' | 'high' = 'low';
    if (pendingOtps > 100) systemLoad = 'high';
    else if (pendingOtps > 50) systemLoad = 'medium';

    return {
      active_users: activeUsers || 0,
      pending_otps: pendingOtps || 0,
      system_load: systemLoad
    };
  } catch (error) {
    console.error('Error getting metrics:', error);
    return {
      active_users: 0,
      pending_otps: 0,
      system_load: 'low' as const
    };
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Run health checks in parallel
    const [databaseStatus, bulkSmsStatus, stripeStatus, metrics] = await Promise.all([
      checkDatabaseHealth(supabase),
      checkBulkSmsHealth(),
      checkStripeHealth(),
      getMetrics(supabase)
    ]);

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseStatus === 'down') {
      overallStatus = 'unhealthy';
    } else if (bulkSmsStatus === 'down' || stripeStatus === 'down') {
      overallStatus = 'degraded';
    }

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: databaseStatus,
        bulksms: bulkSmsStatus,
        stripe: stripeStatus
      },
      metrics
    };

    console.log('Health check completed:', healthStatus);

    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 200 : 503;

    return new Response(
      JSON.stringify(healthStatus),
      { 
        status: statusCode, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in health-check function:', error);
    
    const errorResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'down',
        bulksms: 'down',
        stripe: 'down'
      },
      metrics: {
        active_users: 0,
        pending_otps: 0,
        system_load: 'high'
      }
    };

    return new Response(
      JSON.stringify(errorResponse),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});