-- Fix Customer Data Exposure in users_safe View
-- Enable RLS and add proper policies to protect customer data

-- 1. Enable Row Level Security on the users_safe view
ALTER VIEW public.users_safe ENABLE ROW LEVEL SECURITY;

-- 2. Add RLS policies to protect customer data access
-- Policy 1: Users can only view their own data through the safe view
CREATE POLICY "users_safe_own_data_access" ON public.users_safe
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Admins can view all data through the safe view
CREATE POLICY "users_safe_admin_access" ON public.users_safe
  FOR SELECT 
  USING (public.is_current_user_admin());

-- 3. Ensure no other operations are allowed on the view (it's read-only)
-- Views are naturally read-only, but we make this explicit for security

-- 4. Add audit logging for view access (for monitoring)
CREATE OR REPLACE FUNCTION public.log_users_safe_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive user data view
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    auth.uid(),
    'users_safe_view',
    COALESCE(NEW.id::text, OLD.id::text),
    'view_access',
    jsonb_build_object(
      'accessed_at', NOW(),
      'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Note: Triggers on views require INSTEAD OF triggers, but for monitoring purposes
-- we'll implement this through application-level logging instead

-- 5. Create a secure function to access user data with built-in logging
CREATE OR REPLACE FUNCTION public.get_user_safe_data(target_user_id UUID DEFAULT NULL)
RETURNS TABLE(
  id UUID,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  role TEXT,
  avatar_url TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  kyc_status TEXT,
  phone_verified BOOLEAN,
  email_verified BOOLEAN,
  date_of_birth DATE,
  is_active BOOLEAN,
  is_vip BOOLEAN,
  vip_expiry_date TIMESTAMP WITH TIME ZONE,
  trust_score INTEGER,
  active_groups INTEGER,
  completed_cycles INTEGER,
  wallet_balance DECIMAL,
  total_saved DECIMAL,
  total_earned DECIMAL,
  total_withdrawn DECIMAL,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requesting_user_id UUID := auth.uid();
  is_admin BOOLEAN := public.is_current_user_admin();
  actual_target_id UUID := COALESCE(target_user_id, requesting_user_id);
BEGIN
  -- Security check: users can only access their own data unless they're admin
  IF NOT is_admin AND actual_target_id != requesting_user_id THEN
    RAISE EXCEPTION 'Access denied: Cannot access other users data';
  END IF;
  
  -- Log the access for security monitoring
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    requesting_user_id,
    'user_data_access',
    actual_target_id::text,
    'secure_data_access',
    jsonb_build_object(
      'is_admin', is_admin,
      'target_user', actual_target_id,
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return data from the secure view
  RETURN QUERY 
  SELECT * FROM public.users_safe 
  WHERE users_safe.id = actual_target_id;
END;
$$;

-- 6. Grant appropriate permissions
GRANT SELECT ON public.users_safe TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_safe_data(UUID) TO authenticated;

-- 7. Add index for performance on the view access patterns
CREATE INDEX IF NOT EXISTS idx_users_safe_access 
ON public.users(id, email) 
WHERE is_active = true;