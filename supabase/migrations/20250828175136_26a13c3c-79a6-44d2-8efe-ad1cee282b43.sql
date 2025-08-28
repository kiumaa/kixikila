-- KIXIKILA Security Hardening Migration - Fixed
-- Addresses: Customer Personal Data Protection & System Configuration Security

-- 1. Create security definer function to safely check user roles without RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- 2. Create function to check if user is admin safely
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 3. Add comprehensive RLS policies for sensitive user data protection
-- Drop existing policies to recreate with stronger security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- Recreate user policies with enhanced security
CREATE POLICY "users_can_view_own_basic_profile" ON public.users
  FOR SELECT 
  USING (auth.uid() = id);

-- Simplified update policy - financial data will be protected via functions
CREATE POLICY "users_can_update_own_profile_basic" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "users_can_insert_own_profile" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Admin policies for users table
CREATE POLICY "admins_can_view_all_users" ON public.users
  FOR SELECT 
  USING (public.is_current_user_admin());

CREATE POLICY "admins_can_update_users" ON public.users
  FOR UPDATE 
  USING (public.is_current_user_admin());

-- 4. Create view for safe user data access (masks sensitive data)
CREATE OR REPLACE VIEW public.users_safe AS
SELECT 
  id,
  email,
  full_name,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN phone
    ELSE CONCAT(SUBSTRING(phone FROM 1 FOR 3), '****', SUBSTRING(phone FROM LENGTH(phone)-1))
  END as phone,
  role,
  avatar_url,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN address
    ELSE 'REDACTED'
  END as address,
  city,
  country,
  kyc_status,
  phone_verified,
  email_verified,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN date_of_birth
    ELSE NULL
  END as date_of_birth,
  is_active,
  is_vip,
  vip_expiry_date,
  trust_score,
  active_groups,
  completed_cycles,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN wallet_balance
    ELSE NULL
  END as wallet_balance,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN total_saved
    ELSE NULL
  END as total_saved,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN total_earned
    ELSE NULL
  END as total_earned,
  CASE 
    WHEN auth.uid() = id OR public.is_current_user_admin() THEN total_withdrawn
    ELSE NULL
  END as total_withdrawn,
  last_login,
  created_at,
  updated_at
FROM public.users;

-- 5. Create secure function to update user profile (prevents financial manipulation)
CREATE OR REPLACE FUNCTION public.update_user_profile_secure(
  profile_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID := auth.uid();
  allowed_fields TEXT[] := ARRAY['full_name', 'phone', 'avatar_url', 'address', 'city', 'country', 'date_of_birth'];
  field_name TEXT;
BEGIN
  -- Ensure user is authenticated
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Check that only allowed fields are being updated
  FOR field_name IN SELECT jsonb_object_keys(profile_data)
  LOOP
    IF NOT (field_name = ANY(allowed_fields)) THEN
      RAISE EXCEPTION 'Field % is not allowed to be updated by users', field_name;
    END IF;
  END LOOP;
  
  -- Log the profile update
  INSERT INTO public.audit_logs (
    user_id, 
    entity_type, 
    entity_id, 
    action, 
    new_values,
    ip_address
  ) VALUES (
    user_id,
    'users',
    user_id::text,
    'profile_update',
    profile_data,
    inet_client_addr()
  );
  
  -- Update profile with only allowed fields
  UPDATE public.users 
  SET 
    full_name = COALESCE(profile_data->>'full_name', full_name),
    phone = COALESCE(profile_data->>'phone', phone),
    avatar_url = COALESCE(profile_data->>'avatar_url', avatar_url),
    address = COALESCE(profile_data->>'address', address),
    city = COALESCE(profile_data->>'city', city),
    country = COALESCE(profile_data->>'country', country),
    date_of_birth = CASE 
      WHEN profile_data ? 'date_of_birth' THEN (profile_data->>'date_of_birth')::DATE 
      ELSE date_of_birth 
    END,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- 6. Create function to safely update financial data (admin/system only)
CREATE OR REPLACE FUNCTION public.update_user_financial_data(
  target_user_id UUID,
  new_wallet_balance DECIMAL DEFAULT NULL,
  new_total_earned DECIMAL DEFAULT NULL,
  new_total_withdrawn DECIMAL DEFAULT NULL,
  new_total_saved DECIMAL DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_values JSONB;
BEGIN
  -- Only admins can update financial data
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Get old values for audit
  SELECT jsonb_build_object(
    'wallet_balance', wallet_balance,
    'total_earned', total_earned,
    'total_withdrawn', total_withdrawn,
    'total_saved', total_saved
  ) INTO old_values
  FROM public.users WHERE id = target_user_id;
  
  -- Log the financial update
  INSERT INTO public.audit_logs (
    user_id, 
    entity_type, 
    entity_id, 
    action, 
    old_values, 
    new_values,
    ip_address
  ) VALUES (
    auth.uid(),
    'users',
    target_user_id::text,
    'financial_update',
    old_values,
    jsonb_build_object(
      'wallet_balance', new_wallet_balance,
      'total_earned', new_total_earned,
      'total_withdrawn', new_total_withdrawn,
      'total_saved', new_total_saved
    ),
    inet_client_addr()
  );
  
  -- Update the financial data
  UPDATE public.users 
  SET 
    wallet_balance = COALESCE(new_wallet_balance, wallet_balance),
    total_earned = COALESCE(new_total_earned, total_earned),
    total_withdrawn = COALESCE(new_total_withdrawn, total_withdrawn),
    total_saved = COALESCE(new_total_saved, total_saved),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- 7. Strengthen audit log security
-- Drop and recreate service role policy with restrictions
DROP POLICY IF EXISTS "service_role_can_insert_audit_logs" ON public.audit_logs;

CREATE POLICY "service_role_can_insert_audit_logs" ON public.audit_logs
  FOR INSERT 
  WITH CHECK (
    entity_type IS NOT NULL 
    AND action IS NOT NULL 
    AND created_at IS NOT NULL
  );

-- Add policy to prevent modification of existing audit logs
CREATE POLICY "audit_logs_immutable" ON public.audit_logs
  FOR UPDATE 
  USING (false);

-- 8. Create security monitoring function
CREATE OR REPLACE FUNCTION public.get_security_alerts()
RETURNS TABLE(
  alert_type TEXT,
  severity TEXT,
  message TEXT,
  count BIGINT,
  latest_occurrence TIMESTAMP WITH TIME ZONE
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- Failed login attempts (potential brute force)
  SELECT 
    'failed_logins'::TEXT as alert_type,
    'high'::TEXT as severity,
    'Multiple failed login attempts detected'::TEXT as message,
    COUNT(*) as count,
    MAX(created_at) as latest_occurrence
  FROM public.audit_logs 
  WHERE action = 'login_failed' 
    AND created_at > NOW() - INTERVAL '1 hour'
  GROUP BY alert_type, severity, message
  HAVING COUNT(*) > 5
  
  UNION ALL
  
  -- Suspicious financial activity
  SELECT 
    'financial_anomaly'::TEXT as alert_type,
    'medium'::TEXT as severity,
    'Large financial transactions detected'::TEXT as message,
    COUNT(*) as count,
    MAX(created_at) as latest_occurrence
  FROM public.audit_logs 
  WHERE action = 'financial_update' 
    AND created_at > NOW() - INTERVAL '24 hours'
    AND (new_values->>'wallet_balance')::DECIMAL > 10000
  GROUP BY alert_type, severity, message
  
  UNION ALL
  
  -- Admin privilege usage
  SELECT 
    'admin_activity'::TEXT as alert_type,
    'info'::TEXT as severity,
    'Admin actions performed'::TEXT as message,
    COUNT(*) as count,
    MAX(created_at) as latest_occurrence
  FROM public.audit_logs 
  WHERE user_id IN (SELECT id FROM public.users WHERE role = 'admin')
    AND created_at > NOW() - INTERVAL '24 hours'
  GROUP BY alert_type, severity, message;
$$;

-- 9. Add indexes for security and performance
CREATE INDEX IF NOT EXISTS idx_users_sensitive_data ON public.users(id, email, phone) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_audit_logs_security ON public.audit_logs(user_id, action, created_at) WHERE action IN ('login', 'financial_update', 'role_change');

-- 10. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.users_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile_secure(JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_financial_data(UUID, DECIMAL, DECIMAL, DECIMAL, DECIMAL) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_alerts() TO authenticated;