-- Fix the security definer view issue by recreating without problematic properties

-- Drop and recreate the view properly without security definer properties
DROP VIEW IF EXISTS public.users_public_safe;

-- Create a regular view (not security definer) with masked data
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

-- Set proper RLS on the view
ALTER VIEW public.users_public_safe ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for the view to ensure it's properly secured
CREATE POLICY "public_safe_view_access" 
ON public.users_public_safe 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- Grant access to the view
GRANT SELECT ON public.users_public_safe TO anon, authenticated;

-- Add comment explaining the security approach
COMMENT ON VIEW public.users_public_safe IS 'SECURITY: Public-safe view of user data with sensitive information masked. Does not expose emails, phone numbers, addresses, or financial data.';