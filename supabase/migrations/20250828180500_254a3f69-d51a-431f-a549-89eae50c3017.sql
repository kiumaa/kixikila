-- Fix Customer Data Exposure - Alternative Approach
-- Since views can't have RLS enabled directly, we'll use a different strategy

-- 1. Create a secure function that replaces the problematic view
-- This function will have built-in access controls and audit logging
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
  -- Ensure user is authenticated
  IF requesting_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
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
      'method', 'secure_function',
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return securely masked data
  RETURN QUERY 
  SELECT 
    u.id,
    u.email,
    u.full_name,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.phone
      ELSE CONCAT(SUBSTRING(u.phone FROM 1 FOR 3), '****', SUBSTRING(u.phone FROM LENGTH(u.phone)-1))
    END as phone,
    u.role,
    u.avatar_url,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.address
      ELSE 'REDACTED'
    END as address,
    u.city,
    u.country,
    u.kyc_status,
    u.phone_verified,
    u.email_verified,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.date_of_birth
      ELSE NULL
    END as date_of_birth,
    u.is_active,
    u.is_vip,
    u.vip_expiry_date,
    u.trust_score,
    u.active_groups,
    u.completed_cycles,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.wallet_balance
      ELSE NULL
    END as wallet_balance,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.total_saved
      ELSE NULL
    END as total_saved,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.total_earned
      ELSE NULL
    END as total_earned,
    CASE 
      WHEN requesting_user_id = u.id OR is_admin THEN u.total_withdrawn
      ELSE NULL
    END as total_withdrawn,
    u.last_login,
    u.created_at,
    u.updated_at
  FROM public.users u
  WHERE u.id = actual_target_id
    AND u.is_active = true;
END;
$$;

-- 2. Create a function to get multiple users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_safe_data(
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
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
BEGIN
  -- Only admins can access multiple users data
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log admin access to all users data
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    requesting_user_id,
    'user_data_bulk_access',
    'all_users',
    'admin_bulk_access',
    jsonb_build_object(
      'limit', limit_count,
      'offset', offset_count,
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return all users data (admins see everything)
  RETURN QUERY 
  SELECT * FROM public.users_safe 
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- 3. Make the users_safe view more restrictive by dropping and recreating with limited access
DROP VIEW IF EXISTS public.users_safe;

-- Recreate view with more restrictive access - this view should only be used by admin functions
CREATE VIEW public.users_safe 
WITH (security_invoker=on)
AS
SELECT 
  id,
  email,
  full_name,
  phone,  -- Raw data - will be filtered by calling functions
  role,
  avatar_url,
  address, -- Raw data - will be filtered by calling functions
  city,
  country,
  kyc_status,
  phone_verified,
  email_verified,
  date_of_birth, -- Raw data - will be filtered by calling functions
  is_active,
  is_vip,
  vip_expiry_date,
  trust_score,
  active_groups,
  completed_cycles,
  wallet_balance, -- Raw data - will be filtered by calling functions
  total_saved, -- Raw data - will be filtered by calling functions
  total_earned, -- Raw data - will be filtered by calling functions
  total_withdrawn, -- Raw data - will be filtered by calling functions
  last_login,
  created_at,
  updated_at
FROM public.users
WHERE is_active = true;

-- 4. Restrict direct access to the view - only allow through secure functions
REVOKE ALL ON public.users_safe FROM PUBLIC;
REVOKE ALL ON public.users_safe FROM authenticated;

-- Only grant access to the secure functions
GRANT EXECUTE ON FUNCTION public.get_user_safe_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_safe_data(INTEGER, INTEGER) TO authenticated;

-- Grant internal access to the view for the secure functions
GRANT SELECT ON public.users_safe TO postgres;

-- 5. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_security_access 
ON public.users(id, is_active, role) 
WHERE is_active = true;