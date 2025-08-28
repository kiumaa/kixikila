import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  console.log(`[PRODUCTION-HEALTH] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Health check started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { action } = await req.json().catch(() => ({ action: 'full_check' }));

    switch (action) {
      case 'database_health':
        return await checkDatabaseHealth(supabaseClient);
      
      case 'security_audit':
        return await performSecurityAudit(supabaseClient);
      
      case 'cleanup_expired':
        return await cleanupExpiredData(supabaseClient);
      
      case 'system_stats':
        return await getSystemStats(supabaseClient);
      
      default:
        return await fullHealthCheck(supabaseClient);
    }
  } catch (error) {
    logStep("ERROR in production-health", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function fullHealthCheck(supabaseClient: any) {
  logStep("Performing full health check");

  const results = [];

  try {
    // Database connectivity test
    const { data: healthData, error: healthError } = await supabaseClient
      .rpc('production_health_check');
    
    if (healthError) {
      results.push({
        component: 'Database',
        status: 'ERROR',
        details: healthError.message,
        last_check: new Date().toISOString()
      });
    } else {
      results.push(...healthData);
    }

    // Security audit
    const { data: securityData } = await supabaseClient
      .rpc('comprehensive_security_check');
    
    results.push({
      component: 'Security Audit',
      status: securityData?.length > 0 ? 'PASS' : 'ERROR',
      details: `${securityData?.length || 0} security checks completed`,
      last_check: new Date().toISOString()
    });

    // System statistics
    const { data: statsData } = await supabaseClient
      .rpc('get_system_stats');
    
    if (statsData && statsData.length > 0) {
      const stats = statsData[0];
      results.push({
        component: 'System Stats',
        status: 'HEALTHY',
        details: `Users: ${stats.total_users}, VIP: ${stats.vip_users}, Pending OTPs: ${stats.pending_otps}`,
        last_check: new Date().toISOString()
      });
    }

    logStep("Full health check completed", { results: results.length });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: results,
        summary: {
          total_checks: results.length,
          healthy: results.filter(r => r.status === 'HEALTHY').length,
          warnings: results.filter(r => r.status === 'WARNING').length,
          errors: results.filter(r => r.status === 'ERROR').length
        }
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR in fullHealthCheck", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function checkDatabaseHealth(supabaseClient: any) {
  logStep("Checking database health");

  try {
    const startTime = Date.now();
    
    // Test basic connectivity
    const { data, error } = await supabaseClient
      .from('users')
      .select('id')
      .limit(1);

    const responseTime = Date.now() - startTime;

    if (error) {
      return new Response(
        JSON.stringify({
          success: false,
          component: 'Database',
          status: 'ERROR',
          details: error.message,
          response_time_ms: responseTime
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Database health check passed", { responseTime });

    return new Response(
      JSON.stringify({
        success: true,
        component: 'Database',
        status: 'HEALTHY',
        details: 'Database is accessible and responding',
        response_time_ms: responseTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR in checkDatabaseHealth", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function performSecurityAudit(supabaseClient: any) {
  logStep("Performing security audit");

  try {
    const { data: auditData, error } = await supabaseClient
      .rpc('get_security_alerts');

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Security audit completed", { alerts: auditData?.length || 0 });

    return new Response(
      JSON.stringify({
        success: true,
        data: auditData || [],
        summary: {
          total_alerts: auditData?.length || 0,
          high_priority: auditData?.filter((a: any) => a.severity === 'high').length || 0,
          medium_priority: auditData?.filter((a: any) => a.severity === 'medium').length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR in performSecurityAudit", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function cleanupExpiredData(supabaseClient: any) {
  logStep("Performing cleanup of expired data");

  try {
    const { error } = await supabaseClient
      .rpc('automated_cleanup_production');

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("Cleanup completed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Cleanup completed successfully',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR in cleanupExpiredData", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function getSystemStats(supabaseClient: any) {
  logStep("Getting system statistics");

  try {
    const { data: statsData, error } = await supabaseClient
      .rpc('get_system_stats');

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    logStep("System stats retrieved", { stats: statsData?.[0] || {} });

    return new Response(
      JSON.stringify({
        success: true,
        data: statsData?.[0] || {},
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    logStep("ERROR in getSystemStats", { error: error.message });
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}