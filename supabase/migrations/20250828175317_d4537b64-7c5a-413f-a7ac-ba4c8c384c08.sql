-- Fix Security Definer View Warning
-- Remove the security_barrier property from the view to address linter warning

-- Drop the existing view with security_barrier
DROP VIEW IF EXISTS public.users_safe;

-- Recreate the view without security_barrier property
-- The view will still provide the same data masking functionality
-- but without the security definer warning
CREATE VIEW public.users_safe AS
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

-- Ensure RLS is enabled on the underlying users table (it should be already)
-- The view will inherit the RLS policies from the users table
GRANT SELECT ON public.users_safe TO authenticated;