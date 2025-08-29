-- Critical Security Fixes for KIXIKILA Production

-- 1. Create secure function to prevent role escalation
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Only admins can change roles
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    IF NOT public.is_current_user_admin() THEN
      RAISE EXCEPTION 'Access denied: Only administrators can change user roles';
    END IF;
    
    -- Log the role change
    PERFORM public.log_security_event(
      'role_change_attempt',
      'critical',
      jsonb_build_object(
        'target_user_id', NEW.id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid()
      ),
      true
    );
  END IF;
  
  -- Prevent users from elevating financial data without proper authorization
  IF OLD.wallet_balance IS DISTINCT FROM NEW.wallet_balance OR
     OLD.total_earned IS DISTINCT FROM NEW.total_earned OR 
     OLD.total_withdrawn IS DISTINCT FROM NEW.total_withdrawn OR
     OLD.total_saved IS DISTINCT FROM NEW.total_saved THEN
    IF NOT public.is_current_user_admin() AND auth.uid() != NEW.id THEN
      RAISE EXCEPTION 'Access denied: Financial data can only be updated by the user or administrators';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 2. Add the trigger to users table
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON public.users;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- 3. Create function to validate admin credentials
CREATE OR REPLACE FUNCTION public.validate_admin_credentials(email text, password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  validation_result jsonb := jsonb_build_object('valid', false, 'errors', '[]'::jsonb);
  errors text[] := ARRAY[]::text[];
BEGIN
  -- Validate email format
  IF email IS NULL OR email = '' THEN
    errors := array_append(errors, 'Email is required');
  ELSIF NOT email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    errors := array_append(errors, 'Invalid email format');
  END IF;
  
  -- Validate password strength using existing function
  DECLARE
    pwd_validation RECORD;
  BEGIN
    SELECT * INTO pwd_validation FROM public.validate_password_strength(password);
    
    IF NOT pwd_validation.is_valid THEN
      errors := array_append(errors, 'Password does not meet security requirements');
      -- Add specific password issues
      IF pwd_validation.issues IS NOT NULL THEN
        errors := errors || pwd_validation.issues;
      END IF;
    END IF;
  END;
  
  -- Check if admin email domain is valid
  IF email IS NOT NULL AND NOT public.validate_super_admin_domain(email) THEN
    errors := array_append(errors, 'Admin email must be from @kixikila.pt domain');
  END IF;
  
  -- Return validation result
  IF array_length(errors, 1) IS NULL THEN
    validation_result := jsonb_build_object('valid', true, 'errors', '[]'::jsonb);
  ELSE
    validation_result := jsonb_build_object('valid', false, 'errors', to_jsonb(errors));
  END IF;
  
  RETURN validation_result;
END;
$function$;

-- 4. Create enhanced audit function for critical operations
CREATE OR REPLACE FUNCTION public.audit_critical_operation(
  operation_type text,
  entity_type text DEFAULT 'system',
  entity_id text DEFAULT NULL,
  operation_data jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Insert critical operation log
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    auth.uid(),
    entity_type,
    COALESCE(entity_id, 'critical_operation'),
    operation_type,
    jsonb_build_object(
      'operation_type', operation_type,
      'operation_data', operation_data,
      'timestamp', NOW(),
      'session_info', jsonb_build_object(
        'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
        'session_id', current_setting('request.jwt.claim.session_id', true)
      ),
      'security_level', 'critical',
      'requires_investigation', CASE 
        WHEN operation_type IN ('admin_created', 'role_changed', 'financial_override') THEN true
        ELSE false
      END
    ),
    inet_client_addr()
  );
  
  -- Log security event for monitoring
  PERFORM public.log_security_event(
    operation_type,
    'critical',
    operation_data,
    true -- Auto alert for critical operations
  );
END;
$function$;

-- 5. Update RLS policy for users table to prevent unauthorized updates
DROP POLICY IF EXISTS "users_can_update_limited_fields" ON public.users;
CREATE POLICY "users_can_update_limited_fields" ON public.users
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- Prevent role changes by regular users (this is also enforced by trigger)
  (OLD.role IS NOT DISTINCT FROM NEW.role OR public.is_current_user_admin()) AND
  -- Prevent financial data changes by regular users (also enforced by trigger)
  (
    (OLD.wallet_balance IS NOT DISTINCT FROM NEW.wallet_balance AND
     OLD.total_earned IS NOT DISTINCT FROM NEW.total_earned AND
     OLD.total_withdrawn IS NOT DISTINCT FROM NEW.total_withdrawn AND
     OLD.total_saved IS NOT DISTINCT FROM NEW.total_saved) OR
    public.is_current_user_admin()
  )
);

-- 6. Create function to detect suspicious activities
CREATE OR REPLACE FUNCTION public.detect_suspicious_activities()
RETURNS TABLE(alert_type text, severity text, description text, count bigint, latest_occurrence timestamp with time zone, recommendations text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  -- Multiple failed login attempts from same user
  SELECT 
    'multiple_failed_logins'::text,
    'high'::text,
    'Multiple failed login attempts from same user'::text,
    COUNT(*),
    MAX(created_at),
    ARRAY['Investigate user account', 'Consider temporary suspension', 'Check for brute force attack']::text[]
  FROM public.audit_logs 
  WHERE action = 'login_failed' 
    AND created_at > NOW() - INTERVAL '1 hour'
    AND user_id IS NOT NULL
  GROUP BY user_id
  HAVING COUNT(*) > 5
  
  UNION ALL
  
  -- Suspicious role changes
  SELECT 
    'suspicious_role_changes'::text,
    'critical'::text,
    'Unusual role change patterns detected'::text,
    COUNT(*),
    MAX(created_at),
    ARRAY['Immediate investigation required', 'Verify authorization', 'Check admin access logs']::text[]
  FROM public.audit_logs 
  WHERE action = 'role_change_attempt'
    AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY user_id
  HAVING COUNT(*) > 2
  
  UNION ALL
  
  -- Large financial transactions
  SELECT 
    'large_financial_transactions'::text,
    'medium'::text,
    'Large financial transactions detected'::text,
    COUNT(*),
    MAX(created_at),
    ARRAY['Review transaction legitimacy', 'Verify user identity', 'Check for fraud']::text[]
  FROM public.transactions 
  WHERE ABS(amount) > 5000
    AND created_at > NOW() - INTERVAL '24 hours'
  
  UNION ALL
  
  -- Unusual OTP failures
  SELECT 
    'unusual_otp_failures'::text,
    'medium'::text,
    'High number of OTP failures detected'::text,
    COUNT(*),
    MAX(created_at),
    ARRAY['Check for OTP interception', 'Verify user device security', 'Consider additional verification']::text[]
  FROM public.audit_logs 
  WHERE action = 'otp_status_change'
    AND metadata->>'status' = 'failed'
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY user_id
  HAVING COUNT(*) > 5;
END;
$function$;

-- 7. Create enhanced security monitoring view
CREATE OR REPLACE VIEW public.security_dashboard AS
SELECT 
  'failed_logins_last_hour' as metric,
  COUNT(*) as value,
  'high' as severity,
  'Failed login attempts in the last hour' as description
FROM public.audit_logs 
WHERE action = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour'

UNION ALL

SELECT 
  'admin_actions_today' as metric,
  COUNT(*) as value,
  'info' as severity,
  'Admin actions performed today' as description
FROM public.audit_logs 
WHERE user_id IN (SELECT id FROM public.users WHERE role = 'admin')
  AND created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'active_sessions' as metric,
  COUNT(*) as value,
  'info' as severity,
  'Users logged in within last 24 hours' as description
FROM public.users 
WHERE last_login > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
  'pending_otps' as metric,
  COUNT(*) as value,
  CASE WHEN COUNT(*) > 100 THEN 'medium' ELSE 'low' END as severity,
  'Pending OTP codes in system' as description
FROM public.otp_codes 
WHERE status = 'pending' AND expires_at > NOW();

-- Grant access to security dashboard for admins only
GRANT SELECT ON public.security_dashboard TO authenticated;

-- Create RLS policy for security dashboard
CREATE POLICY "admins_can_view_security_dashboard" ON public.security_dashboard
FOR SELECT USING (public.is_current_user_admin());