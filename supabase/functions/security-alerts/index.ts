import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SecurityAlert {
  id: string
  type: 'FAILED_LOGINS' | 'SUSPICIOUS_IP' | 'ADMIN_ACTION' | 'DATA_BREACH' | 'RATE_LIMIT_EXCEEDED'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  user_id?: string
  ip_address?: string
  created_at: string
  resolved: boolean
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Running security analysis...')

    // Analyze recent audit logs for suspicious patterns
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const lastHour = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Check for multiple failed login attempts
    const { data: failedLogins } = await supabaseClient
      .from('audit_logs')
      .select('ip_address, user_id, created_at')
      .eq('entity_type', 'AUTH')
      .eq('action', 'LOGIN_FAILED')
      .gte('created_at', last24Hours)

    // Check for suspicious admin actions
    const { data: adminActions } = await supabaseClient
      .from('audit_logs')
      .select('user_id, action, ip_address, created_at')
      .eq('entity_type', 'ADMIN')
      .gte('created_at', lastHour)

    // Check for high-risk events
    const { data: criticalEvents } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .in('entity_type', ['SECURITY', 'FINANCIAL'])
      .gte('created_at', last24Hours)

    const alerts: SecurityAlert[] = []

    // Analyze failed logins by IP
    if (failedLogins && failedLogins.length > 0) {
      const ipCounts: { [key: string]: number } = {}
      failedLogins.forEach(login => {
        if (login.ip_address) {
          ipCounts[login.ip_address] = (ipCounts[login.ip_address] || 0) + 1
        }
      })

      Object.entries(ipCounts).forEach(([ip, count]) => {
        if (count >= 5) {
          alerts.push({
            id: `failed-login-${ip}-${Date.now()}`,
            type: 'FAILED_LOGINS',
            severity: count >= 10 ? 'CRITICAL' : 'HIGH',
            title: 'Multiple Failed Login Attempts',
            description: `${count} failed login attempts from IP ${ip} in the last 24 hours`,
            ip_address: ip,
            created_at: new Date().toISOString(),
            resolved: false
          })
        }
      })
    }

    // Analyze admin actions
    if (adminActions && adminActions.length > 5) {
      alerts.push({
        id: `admin-activity-${Date.now()}`,
        type: 'ADMIN_ACTION',
        severity: 'MEDIUM',
        title: 'High Admin Activity',
        description: `${adminActions.length} admin actions performed in the last hour`,
        created_at: new Date().toISOString(),
        resolved: false
      })
    }

    // Analyze critical events
    if (criticalEvents && criticalEvents.length > 0) {
      criticalEvents.forEach((event, index) => {
        alerts.push({
          id: `critical-event-${event.id}`,
          type: 'DATA_BREACH',
          severity: 'CRITICAL',
          title: `Security Event: ${event.action}`,
          description: `Critical security event detected: ${event.action}`,
          user_id: event.user_id,
          ip_address: event.ip_address,
          created_at: event.created_at,
          resolved: false
        })
      })
    }

    // Send critical alerts via email/SMS if any CRITICAL alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL')
    if (criticalAlerts.length > 0) {
      console.log(`CRITICAL SECURITY ALERT: ${criticalAlerts.length} critical alerts detected`)
      
      // Here you would integrate with your notification service
      // For now, we'll just log the alerts
      criticalAlerts.forEach(alert => {
        console.log(`CRITICAL ALERT: ${alert.title} - ${alert.description}`)
      })
    }

    // Get recent security metrics
    const { data: recentLogs } = await supabaseClient
      .from('audit_logs')
      .select('entity_type, action, created_at')
      .gte('created_at', last24Hours)
      .order('created_at', { ascending: false })

    const metrics = {
      total_events_24h: recentLogs?.length || 0,
      auth_events: recentLogs?.filter(l => l.entity_type === 'AUTH').length || 0,
      admin_events: recentLogs?.filter(l => l.entity_type === 'ADMIN').length || 0,
      security_events: recentLogs?.filter(l => l.entity_type === 'SECURITY').length || 0,
      financial_events: recentLogs?.filter(l => l.entity_type === 'FINANCIAL').length || 0,
      failed_logins: failedLogins?.length || 0,
      unique_ips: [...new Set(recentLogs?.map(l => l.ip_address).filter(Boolean))].length
    }

    console.log(`Security analysis completed. Found ${alerts.length} alerts.`)

    return new Response(
      JSON.stringify({
        alerts,
        metrics,
        analysis_timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in security-alerts function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})