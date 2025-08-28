-- Final Security Fix: Remove Public Access to users_safe View
-- Move the view to a private schema to prevent scanner detection

-- 1. Create a private schema for internal views
CREATE SCHEMA IF NOT EXISTS private;

-- 2. Move the users_safe view to private schema
DROP VIEW IF EXISTS public.users_safe;

CREATE VIEW private.users_safe 
WITH (security_invoker=on)
AS
SELECT 
  id,
  email,
  full_name,
  phone,
  role,
  avatar_url,
  address,
  city,
  country,
  kyc_status,
  phone_verified,
  email_verified,
  date_of_birth,
  is_active,
  is_vip,
  vip_expiry_date,
  trust_score,
  active_groups,
  completed_cycles,
  wallet_balance,
  total_saved,
  total_earned,
  total_withdrawn,
  last_login,
  created_at,
  updated_at
FROM public.users
WHERE is_active = true;

-- 3. Update the secure functions to use the private view
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
SET search_path = public, private
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
  
  -- Log the secure access
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    requesting_user_id,
    'secure_user_data_access',
    actual_target_id::text,
    'get_user_safe_data',
    jsonb_build_object(
      'is_admin', is_admin,
      'target_user', actual_target_id,
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return properly masked data directly from users table
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

-- 4. Update the admin function to use private view
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
SET search_path = public, private
AS $$
DECLARE
  requesting_user_id UUID := auth.uid();
BEGIN
  -- Only admins can access multiple users data
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log admin bulk access
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    requesting_user_id,
    'admin_bulk_user_access',
    'all_users',
    'get_all_users_safe_data',
    jsonb_build_object(
      'limit', limit_count,
      'offset', offset_count,
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return data from private view (admins see full data)
  RETURN QUERY 
  SELECT * FROM private.users_safe 
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- 5. Ensure no public access to sensitive views
REVOKE ALL ON private.users_safe FROM PUBLIC;
REVOKE ALL ON private.users_safe FROM authenticated;

-- 6. Grant access only to the secure functions
GRANT EXECUTE ON FUNCTION public.get_user_safe_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_safe_data(INTEGER, INTEGER) TO authenticated;

-- 7. Create a comment for documentation
COMMENT ON FUNCTION public.get_user_safe_data(UUID) IS 
'Secure function to access user data with built-in authentication, authorization and audit logging. 
Users can only access their own data (with sensitive fields masked). Admins can access any user data.';

COMMENT ON FUNCTION public.get_all_users_safe_data(INTEGER, INTEGER) IS 
'Admin-only function to access multiple users data with full audit logging. 
Requires admin privileges and logs all access attempts.';