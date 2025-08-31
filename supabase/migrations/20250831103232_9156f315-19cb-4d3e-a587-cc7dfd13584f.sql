-- Critical Security Fixes for Data Exposure and RLS Policies (Fixed)

-- 1. Fix users table data exposure - restrict access to authenticated users only
DROP POLICY IF EXISTS "deny_all_unauthenticated_access" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_secure_access" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_data_only" ON public.users;
DROP POLICY IF EXISTS "users_own_data_access" ON public.users;
DROP POLICY IF EXISTS "admins_full_user_access" ON public.users;

CREATE POLICY "users_own_data_secure_access" ON public.users
FOR ALL USING (
  auth.uid() = id OR 
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- 2. Fix transactions table - prevent cross-user data access
DROP POLICY IF EXISTS "users_own_transactions_only" ON public.transactions;
CREATE POLICY "users_own_transactions_only" ON public.transactions
FOR SELECT USING (
  user_id = auth.uid() OR 
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin')
);

-- 3. Fix groups table - respect privacy settings
DROP POLICY IF EXISTS "users_can_view_accessible_groups" ON public.groups;
CREATE POLICY "users_can_view_accessible_groups" ON public.groups
FOR SELECT USING (
  NOT is_private OR 
  creator_id = auth.uid() OR 
  (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin') OR
  EXISTS (
    SELECT 1 FROM group_members gm 
    WHERE gm.group_id = groups.id 
    AND gm.user_id = auth.uid() 
    AND gm.status IN ('active', 'pending')
  )
);

-- 4. Secure audit_logs table - admin only access
DROP POLICY IF EXISTS "admin_can_view_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "admins_can_access_security_functions" ON public.audit_logs;
CREATE POLICY "admin_only_audit_logs" ON public.audit_logs
FOR ALL USING (
  auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin'
);

-- 5. Secure OTP codes - users can only see their own
DROP POLICY IF EXISTS "Users can view own OTP codes" ON public.otp_codes;
CREATE POLICY "users_own_otp_codes_only" ON public.otp_codes
FOR ALL USING (
  user_id = auth.uid()
);

-- 6. Drop and recreate data masking function
DROP FUNCTION IF EXISTS public.mask_personal_data(TEXT, UUID, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.mask_personal_data(
  data_value TEXT, 
  owner_id UUID, 
  data_type TEXT,
  requesting_user_id UUID DEFAULT auth.uid()
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  -- Only owner and admin can see full data
  IF requesting_user_id = owner_id OR get_user_role(requesting_user_id) = 'admin' THEN
    RETURN data_value;
  END IF;
  
  -- Mask based on data type
  CASE data_type
    WHEN 'email' THEN
      RETURN CONCAT(LEFT(data_value, 2), '***@***', RIGHT(data_value, 4));
    WHEN 'phone' THEN
      RETURN CONCAT(LEFT(data_value, 3), '****', RIGHT(data_value, 2));
    WHEN 'address' THEN
      RETURN 'REDACTED';
    ELSE
      RETURN '***';
  END CASE;
END;
$$;

-- 7. Enhanced security event logging
CREATE OR REPLACE FUNCTION public.log_security_violation(
  violation_type TEXT,
  severity TEXT DEFAULT 'medium',
  details JSONB DEFAULT '{}'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    auth.uid(),
    'security_violation',
    violation_type,
    'security_event',
    jsonb_build_object(
      'severity', severity,
      'violation_type', violation_type,
      'details', details,
      'timestamp', NOW(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    inet_client_addr()
  );
END;
$$;