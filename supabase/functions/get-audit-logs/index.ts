import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const eventType = url.searchParams.get('event_type')
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')
    const riskLevel = url.searchParams.get('risk_level')

    console.log('Fetching audit logs with params:', { page, limit, eventType, startDate, endDate, riskLevel })

    // Build query
    let query = supabaseClient
      .from('audit_logs')
      .select(`
        *,
        users!inner(
          full_name,
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (eventType) {
      query = query.eq('entity_type', eventType)
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching audit logs:', error)
      throw error
    }

    console.log(`Successfully fetched ${logs?.length || 0} audit logs`)

    // Get summary statistics
    const { data: stats } = await supabaseClient
      .from('audit_logs')
      .select('entity_type, action')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const summary = {
      total_today: stats?.length || 0,
      auth_events: stats?.filter(s => s.entity_type === 'AUTH').length || 0,
      admin_actions: stats?.filter(s => s.entity_type === 'ADMIN').length || 0,
      security_events: stats?.filter(s => s.entity_type === 'SECURITY').length || 0,
      financial_events: stats?.filter(s => s.entity_type === 'FINANCIAL').length || 0
    }

    return new Response(
      JSON.stringify({
        logs: logs || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        },
        summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in get-audit-logs function:', error)
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