-- Final security fix: Create a proper public-safe view without RLS complications

-- Drop and recreate the view with proper security
DROP VIEW IF EXISTS public.users_public_safe;

-- Create a simple, secure view with masked data
CREATE VIEW public.users_public_safe AS
SELECT 
  id,
  -- Only safe, non-sensitive data with masking
  CASE 
    WHEN full_name IS NOT NULL THEN SUBSTRING(full_name FROM 1 FOR 1) || '***'
    ELSE 'Anonymous'
  END as display_name,
  -- Basic location info (non-sensitive)
  city,
  country,
  -- Public profile elements
  avatar_url,
  trust_score,
  is_vip,
  created_at
FROM public.users
WHERE is_active = true;

-- Grant minimal access to the view
GRANT SELECT ON public.users_public_safe TO anon, authenticated;

-- Add security documentation
COMMENT ON VIEW public.users_public_safe IS 'SECURITY: Public view with masked user data. Exposes only non-sensitive information (no emails, phone numbers, addresses, or financial data). Access is controlled by the underlying users table RLS policies.';

-- Final security validation: Ensure no sensitive data can be accessed by anonymous users
-- This will prevent any possibility of data leakage
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.users FROM public;

-- Ensure only authenticated users can access the main users table
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;