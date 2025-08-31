import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

interface SecurityMonitoringRequest {
  action: 'get_alerts' | 'get_threat_summary' | 'check_user_security' | 'log_incident'
  data?: any
  user_id?: string
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

    const { action, data, user_id }: SecurityMonitoringRequest = await req.json()

    switch (action) {
      case 'get_alerts':
        return await getSecurityAlerts(supabaseClient)
      
      case 'get_threat_summary':
        return await getThreatSummary(supabaseClient)
      
      case 'check_user_security':
        return await checkUserSecurity(supabaseClient, user_id)
      
      case 'log_incident':
        return await logSecurityIncident(supabaseClient, data, user_id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: corsHeaders }
        )
    }

  } catch (error) {
    console.error('Security monitoring error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        headers: corsHeaders,
        status: 500,
      },
    )
  }
})

async function getSecurityAlerts(supabaseClient: any): Promise<Response> {
  try {
    // Get recent security violations
    const { data: violations, error: violationsError } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'security_violation')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (violationsError) throw violationsError

    // Get failed login attempts
    const { data: failedLogins, error: loginsError } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('action', 'login_failed')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (loginsError) throw loginsError

    // Get suspicious OTP activity
    const { data: suspiciousOtp, error: otpError } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('entity_type', 'otp_codes')
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    if (otpError) throw otpError

    const alerts = {
      high_priority: [],
      medium_priority: [],
      low_priority: [],
      summary: {
        total_violations: violations?.length || 0,
        failed_logins: failedLogins?.length || 0,
        suspicious_otp: suspiciousOtp?.length || 0,
        timestamp: new Date().toISOString()
      }
    }

    // Categorize alerts by severity
    violations?.forEach(violation => {
      const severity = violation.metadata?.severity || 'medium'
      const alert = {
        id: violation.id,
        type: violation.entity_id,
        message: violation.metadata?.details || 'Security violation detected',
        timestamp: violation.created_at,
        user_id: violation.user_id,
        metadata: violation.metadata
      }

      if (severity === 'critical' || severity === 'high') {
        alerts.high_priority.push(alert)
      } else if (severity === 'medium') {
        alerts.medium_priority.push(alert)
      } else {
        alerts.low_priority.push(alert)
      }
    })

    // Add failed login alerts if threshold exceeded
    if (failedLogins && failedLogins.length > 5) {
      alerts.high_priority.push({
        id: 'failed_logins_' + Date.now(),
        type: 'brute_force_attempt',
        message: `${failedLogins.length} failed login attempts detected in the last hour`,
        timestamp: new Date().toISOString(),
        metadata: { count: failedLogins.length }
      })
    }

    return new Response(JSON.stringify(alerts), { 
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Error getting security alerts:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve security alerts' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

async function getThreatSummary(supabaseClient: any): Promise<Response> {
  try {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Security events in last 24 hours
    const { data: recentThreats, error: recentError } = await supabaseClient
      .from('audit_logs')
      .select('entity_type, action, metadata')
      .eq('entity_type', 'security_violation')
      .gte('created_at', last24Hours)

    if (recentError) throw recentError

    // Trend analysis - last week
    const { data: weeklyThreats, error: weeklyError } = await supabaseClient
      .from('audit_logs')
      .select('entity_type, action, created_at')
      .eq('entity_type', 'security_violation')
      .gte('created_at', lastWeek)

    if (weeklyError) throw weeklyError

    // Calculate threat metrics
    const threatSummary = {
      current_threat_level: 'low', // default
      threats_24h: recentThreats?.length || 0,
      threats_week: weeklyThreats?.length || 0,
      trend: 'stable',
      top_threats: [],
      recommendations: []
    }

    // Determine threat level
    if (threatSummary.threats_24h > 10) {
      threatSummary.current_threat_level = 'high'
      threatSummary.recommendations.push('Immediate security review required')
    } else if (threatSummary.threats_24h > 5) {
      threatSummary.current_threat_level = 'medium'
      threatSummary.recommendations.push('Monitor security events closely')
    }

    // Calculate trend
    const dailyAverage = threatSummary.threats_week / 7
    if (threatSummary.threats_24h > dailyAverage * 1.5) {
      threatSummary.trend = 'increasing'
      threatSummary.recommendations.push('Security threat activity is increasing')
    } else if (threatSummary.threats_24h < dailyAverage * 0.5) {
      threatSummary.trend = 'decreasing'
    }

    // Analyze threat types
    const threatTypes = {}
    recentThreats?.forEach(threat => {
      const type = threat.metadata?.violation_type || 'unknown'
      threatTypes[type] = (threatTypes[type] || 0) + 1
    })

    threatSummary.top_threats = Object.entries(threatTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return new Response(JSON.stringify(threatSummary), { 
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Error getting threat summary:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to get threat summary' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

async function checkUserSecurity(supabaseClient: any, userId: string): Promise<Response> {
  try {
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID required' }),
        { status: 400, headers: corsHeaders }
      )
    }

    // Check user's recent security events
    const { data: userEvents, error: eventsError } = await supabaseClient
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (eventsError) throw eventsError

    // Check for suspicious patterns
    const securityProfile = {
      user_id: userId,
      risk_level: 'low',
      suspicious_activities: [],
      login_patterns: {},
      recommendations: [],
      last_assessed: new Date().toISOString()
    }

    let riskScore = 0
    const loginAttempts = userEvents?.filter(e => e.action.includes('login')) || []
    const failedLogins = loginAttempts.filter(e => e.action === 'login_failed') || []

    // Analyze login patterns
    if (failedLogins.length > 3) {
      riskScore += 30
      securityProfile.suspicious_activities.push({
        type: 'multiple_failed_logins',
        count: failedLogins.length,
        severity: 'medium'
      })
    }

    // Check for rapid successive attempts
    if (loginAttempts.length > 10) {
      riskScore += 20
      securityProfile.suspicious_activities.push({
        type: 'excessive_login_attempts',
        count: loginAttempts.length,
        severity: 'medium'
      })
    }

    // Check for security violations
    const violations = userEvents?.filter(e => e.entity_type === 'security_violation') || []
    if (violations.length > 0) {
      riskScore += violations.length * 15
      securityProfile.suspicious_activities.push({
        type: 'security_violations',
        count: violations.length,
        severity: 'high'
      })
    }

    // Determine risk level
    if (riskScore >= 50) {
      securityProfile.risk_level = 'high'
      securityProfile.recommendations.push('Consider account restrictions')
      securityProfile.recommendations.push('Require additional verification')
    } else if (riskScore >= 25) {
      securityProfile.risk_level = 'medium'
      securityProfile.recommendations.push('Monitor account activity closely')
    } else {
      securityProfile.recommendations.push('Account security looks good')
    }

    return new Response(JSON.stringify(securityProfile), { 
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Error checking user security:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check user security' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

async function logSecurityIncident(
  supabaseClient: any, 
  incidentData: any, 
  userId?: string
): Promise<Response> {
  try {
    const incident = {
      user_id: userId,
      entity_type: 'security_incident',
      entity_id: incidentData.incident_type || 'manual_report',
      action: 'incident_logged',
      metadata: {
        ...incidentData,
        reported_at: new Date().toISOString(),
        severity: incidentData.severity || 'medium',
        source: 'manual_report'
      }
    }

    const { error } = await supabaseClient
      .from('audit_logs')
      .insert(incident)

    if (error) throw error

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Security incident logged successfully',
      incident_id: incident.entity_id
    }), { 
      headers: corsHeaders,
      status: 200
    })

  } catch (error) {
    console.error('Error logging security incident:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to log security incident' }),
      { status: 500, headers: corsHeaders }
    )
  }
}