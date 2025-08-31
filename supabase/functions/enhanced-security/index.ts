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

interface SecurityValidationRequest {
  action: 'validate_input' | 'log_security_event' | 'check_rate_limit' | 'validate_otp'
  data?: any
  user_id?: string
  ip_address?: string
}

interface RateLimitCheck {
  key: string
  max_attempts: number
  window_minutes: number
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

    const { action, data, user_id, ip_address }: SecurityValidationRequest = await req.json()

    switch (action) {
      case 'validate_input':
        return await validateInput(data)
      
      case 'log_security_event':
        return await logSecurityEvent(supabaseClient, data, user_id, ip_address)
      
      case 'check_rate_limit':
        return await checkRateLimit(supabaseClient, data as RateLimitCheck, user_id, ip_address)
      
      case 'validate_otp':
        return await validateOTPSecurity(supabaseClient, data, user_id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: corsHeaders }
        )
    }

  } catch (error) {
    console.error('Enhanced security error:', error)
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

async function validateInput(data: any): Promise<Response> {
  const { input, type, maxLength = 1000 } = data
  
  // Input validation rules
  const validationRules = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\+?[1-9]\d{8,14}$/,
    name: /^[a-zA-ZÀ-ÿ\s'-]{2,50}$/,
    alphanumeric: /^[a-zA-Z0-9\s_-]+$/,
    numeric: /^\d+$/
  }
  
  // Check for malicious patterns
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi,
    /(union|select|insert|delete|drop|create|alter|exec|execute)/gi,
    /(\|\||&&|\|)/g // Command injection
  ]
  
  const validation = {
    isValid: true,
    errors: [] as string[],
    sanitized: input
  }
  
  // Basic checks
  if (!input || typeof input !== 'string') {
    validation.isValid = false
    validation.errors.push('Input is required and must be a string')
    return new Response(JSON.stringify(validation), { headers: corsHeaders })
  }
  
  if (input.length > maxLength) {
    validation.isValid = false
    validation.errors.push(`Input exceeds maximum length of ${maxLength} characters`)
  }
  
  // Check for dangerous patterns
  for (const pattern of dangerousPatterns) {
    if (pattern.test(input)) {
      validation.isValid = false
      validation.errors.push('Input contains potentially dangerous content')
      break
    }
  }
  
  // Type-specific validation
  if (type && validationRules[type as keyof typeof validationRules]) {
    const regex = validationRules[type as keyof typeof validationRules]
    if (!regex.test(input)) {
      validation.isValid = false
      validation.errors.push(`Input does not match required format for ${type}`)
    }
  }
  
  // Sanitize input (basic sanitization)
  validation.sanitized = input
    .trim()
    .replace(/[<>]/g, '') // Remove basic HTML chars
    .replace(/['"]/g, '') // Remove quotes that could break attributes
  
  return new Response(JSON.stringify(validation), { 
    headers: corsHeaders,
    status: validation.isValid ? 200 : 400
  })
}

async function logSecurityEvent(
  supabaseClient: any, 
  eventData: any, 
  user_id?: string, 
  ip_address?: string
): Promise<Response> {
  try {
    await supabaseClient
      .from('audit_logs')
      .insert({
        user_id: user_id || null,
        entity_type: 'security_event',
        entity_id: eventData.event_type || 'unknown',
        action: 'security_violation',
        metadata: {
          ...eventData,
          timestamp: new Date().toISOString(),
          severity: eventData.severity || 'medium',
          automatic: true
        },
        ip_address: ip_address
      })

    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  } catch (error) {
    console.error('Error logging security event:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to log security event' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

async function checkRateLimit(
  supabaseClient: any,
  rateLimit: RateLimitCheck,
  user_id?: string,
  ip_address?: string
): Promise<Response> {
  try {
    const { key, max_attempts, window_minutes } = rateLimit
    const windowStart = new Date(Date.now() - (window_minutes * 60 * 1000)).toISOString()
    
    // Count recent attempts
    const { data: attempts, error } = await supabaseClient
      .from('audit_logs')
      .select('id')
      .eq('entity_type', 'rate_limit_check')
      .eq('entity_id', key)
      .gte('created_at', windowStart)
    
    if (error) throw error
    
    const currentAttempts = attempts?.length || 0
    const remainingAttempts = Math.max(0, max_attempts - currentAttempts)
    const isAllowed = currentAttempts < max_attempts
    
    // Log this check
    if (!isAllowed) {
      await supabaseClient
        .from('audit_logs')
        .insert({
          user_id: user_id || null,
          entity_type: 'security_violation',
          entity_id: 'rate_limit_exceeded',
          action: 'rate_limit_blocked',
          metadata: {
            key,
            attempts: currentAttempts,
            max_attempts,
            window_minutes,
            blocked: true
          },
          ip_address: ip_address
        })
    }
    
    return new Response(JSON.stringify({
      allowed: isAllowed,
      attempts: currentAttempts,
      remaining: remainingAttempts,
      resetTime: new Date(Date.now() + (window_minutes * 60 * 1000)).toISOString()
    }), { headers: corsHeaders })
    
  } catch (error) {
    console.error('Rate limit check error:', error)
    return new Response(
      JSON.stringify({ error: 'Rate limit check failed' }),
      { status: 500, headers: corsHeaders }
    )
  }
}

async function validateOTPSecurity(
  supabaseClient: any,
  otpData: any,
  user_id?: string
): Promise<Response> {
  try {
    const { code, user_phone } = otpData
    
    // Security checks for OTP
    const securityIssues = []
    
    // Check OTP format
    if (!/^\d{6}$/.test(code)) {
      securityIssues.push('Invalid OTP format')
    }
    
    // Check for sequential or repeated digits (weak OTPs)
    if (/(\d)\1{3,}/.test(code) || /(?:0123|1234|2345|3456|4567|5678|6789|9876|8765|7654|6543|5432|4321|3210)/.test(code)) {
      securityIssues.push('OTP appears to use weak pattern')
    }
    
    // Check recent OTP usage patterns for this user
    if (user_id) {
      const { data: recentOtps } = await supabaseClient
        .from('otp_codes')
        .select('code, created_at')
        .eq('user_id', user_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (recentOtps && recentOtps.length > 5) {
        securityIssues.push('High OTP generation frequency detected')
      }
    }
    
    return new Response(JSON.stringify({
      valid: securityIssues.length === 0,
      issues: securityIssues,
      riskLevel: securityIssues.length === 0 ? 'low' : securityIssues.length > 2 ? 'high' : 'medium'
    }), { headers: corsHeaders })
    
  } catch (error) {
    console.error('OTP validation error:', error)
    return new Response(
      JSON.stringify({ error: 'OTP validation failed' }),
      { status: 500, headers: corsHeaders }
    )
  }
}