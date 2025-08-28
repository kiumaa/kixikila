import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SystemStats {
  total_users: number;
  active_users: number;
  vip_users: number;
  pending_otps: number;
  unread_notifications: number;
}

interface HealthMetrics {
  database_health: 'healthy' | 'degraded' | 'down';
  system_load: 'low' | 'medium' | 'high';
  memory_usage: number;
  active_connections: number;
}

const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [ADMIN-MONITORING] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Admin monitoring function started');

    // Create Supabase client with service role for bypassing RLS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Authenticate admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header provided');
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      logStep('ERROR: User authentication failed', { error: userError?.message });
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profileError || userProfile?.role !== 'admin') {
      logStep('ERROR: User is not admin', { userId: userData.user.id, role: userProfile?.role });
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logStep('Admin authenticated successfully', { userId: userData.user.id });

    // Get system statistics
    logStep('Fetching system statistics');
    const { data: stats, error: statsError } = await supabase
      .rpc('get_system_stats');

    if (statsError) {
      logStep('ERROR: Failed to fetch system stats', { error: statsError.message });
      throw new Error(`Failed to fetch system statistics: ${statsError.message}`);
    }

    logStep('System stats retrieved', stats);

    // Get recent audit logs
    logStep('Fetching recent audit logs');
    const { data: auditLogs, error: auditError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (auditError) {
      logStep('WARNING: Failed to fetch audit logs', { error: auditError.message });
    }

    // Calculate health metrics
    const systemStats = (stats as any[])?.[0] as SystemStats;
    const healthMetrics: HealthMetrics = {
      database_health: 'healthy', // Default, could be enhanced with actual checks
      system_load: systemStats?.pending_otps > 100 ? 'high' : 
                   systemStats?.pending_otps > 50 ? 'medium' : 'low',
      memory_usage: 0, // Placeholder - would need actual memory monitoring
      active_connections: systemStats?.active_users || 0
    };

    // Get recent errors from edge functions (if any)
    logStep('Preparing response data');
    const responseData = {
      timestamp: new Date().toISOString(),
      system_stats: systemStats,
      health_metrics: healthMetrics,
      audit_logs: auditLogs || [],
      alerts: generateAlerts(systemStats, healthMetrics),
      version: '1.0.0'
    };

    logStep('Admin monitoring completed successfully');

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logStep('ERROR: Admin monitoring failed', { 
      message: error instanceof Error ? error.message : String(error) 
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateAlerts(stats: SystemStats, health: HealthMetrics) {
  const alerts = [];

  // High system load alert
  if (health.system_load === 'high') {
    alerts.push({
      type: 'warning',
      title: 'High System Load',
      message: `Sistema com alta carga: ${stats.pending_otps} OTPs pendentes`,
      priority: 'medium'
    });
  }

  // Low active users alert
  if (stats.active_users === 0) {
    alerts.push({
      type: 'info',
      title: 'No Active Users',
      message: 'Nenhum usuário ativo nos últimos 7 dias',
      priority: 'low'
    });
  }

  // High unread notifications
  if (stats.unread_notifications > 1000) {
    alerts.push({
      type: 'warning',
      title: 'High Unread Notifications',
      message: `${stats.unread_notifications} notificações não lidas`,
      priority: 'medium'
    });
  }

  // VIP users expiring soon (would need additional query)
  if (stats.vip_users > 0) {
    alerts.push({
      type: 'info',
      title: 'VIP Users Active',
      message: `${stats.vip_users} usuários VIP ativos`,
      priority: 'low'
    });
  }

  return alerts;
}