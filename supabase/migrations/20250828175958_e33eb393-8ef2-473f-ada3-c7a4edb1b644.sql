-- Fix Security Definer View Issue
-- The issue is that our view defaults to SECURITY DEFINER which bypasses RLS
-- We need to explicitly set security_invoker=on to respect RLS policies

-- Drop the existing problematic view
DROP VIEW IF EXISTS public.users_safe;

-- Recreate the view with security_invoker=on to fix the security issue
-- This ensures the view respects RLS policies of the querying user
CREATE VIEW public.users_safe 
WITH (security_invoker=on)
AS
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

-- Ensure proper permissions
GRANT SELECT ON public.users_safe TO authenticated;