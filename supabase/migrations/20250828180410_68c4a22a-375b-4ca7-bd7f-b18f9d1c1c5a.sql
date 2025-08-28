-- Fix Customer Data Exposure - Alternative Approach
-- Since views can't have RLS directly, we'll use a secure function approach

-- 1. Drop the problematic view
DROP VIEW IF EXISTS public.users_safe;

-- 2. Create a secure function that provides safe user data access with built-in protection
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
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return masked data based on access level
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

-- 3. Create a function to get multiple users (admin only)
CREATE OR REPLACE FUNCTION public.get_users_safe_list(
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
  -- Only admins can access user lists
  IF NOT public.is_current_user_admin() THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Log the access
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    requesting_user_id,
    'user_list_access',
    'bulk',
    'admin_user_list_access',
    jsonb_build_object(
      'limit', limit_count,
      'offset', offset_count,
      'accessed_at', NOW()
    ),
    inet_client_addr()
  );
  
  -- Return all user data (no masking for admins)
  RETURN QUERY 
  SELECT 
    u.id, u.email, u.full_name, u.phone, u.role, u.avatar_url, u.address,
    u.city, u.country, u.kyc_status, u.phone_verified, u.email_verified,
    u.date_of_birth, u.is_active, u.is_vip, u.vip_expiry_date, u.trust_score,
    u.active_groups, u.completed_cycles, u.wallet_balance, u.total_saved,
    u.total_earned, u.total_withdrawn, u.last_login, u.created_at, u.updated_at
  FROM public.users u
  WHERE u.is_active = true
  ORDER BY u.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$;

-- 4. Grant permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_safe_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_users_safe_list(INTEGER, INTEGER) TO authenticated;

-- 5. Add performance indexes
CREATE INDEX IF NOT EXISTS idx_users_secure_access 
ON public.users(id, is_active, created_at) 
WHERE is_active = true;