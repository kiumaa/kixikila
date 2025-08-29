-- Fix the security definer view issue

-- 1. Drop the problematic view with security_barrier
DROP VIEW IF EXISTS public.public_user_profiles;

-- 2. Create a regular view without security definer properties
CREATE VIEW public.public_user_profiles AS
SELECT 
  id,
  full_name,
  avatar_url,
  city,
  country,
  created_at,
  is_vip,
  -- Only show trust score ranges for privacy (no actual scores)
  CASE 
    WHEN trust_score >= 90 THEN 'Excellent'
    WHEN trust_score >= 70 THEN 'Good' 
    WHEN trust_score >= 50 THEN 'Fair'
    ELSE 'New User'
  END as trust_level
FROM public.users 
WHERE is_active = true;

-- 3. Create proper RLS policy for the view access
CREATE POLICY "public_profiles_view_access" ON public.users
FOR SELECT
TO anon, authenticated
USING (
  -- Only allow access to non-sensitive fields through specific queries
  -- This will be enforced by the application layer for the view
  is_active = true
);

-- 4. However, we need to be more restrictive - remove public access entirely
DROP POLICY IF EXISTS "public_profiles_view_access" ON public.users;
DROP POLICY IF EXISTS "public_can_view_safe_profiles" ON public.users;

-- 5. Revoke public access to the view as well for maximum security
REVOKE SELECT ON public.public_user_profiles FROM anon;

-- 6. Only allow authenticated users to use the safe profile view
GRANT SELECT ON public.public_user_profiles TO authenticated;

-- 7. Create RLS policy for authenticated access to public profiles only
CREATE POLICY "authenticated_can_view_public_profiles" ON public.users
FOR SELECT  
TO authenticated
USING (is_active = true AND (auth.uid() = id OR public.is_current_user_admin()));

-- 8. Final verification of security policies
SELECT 
  'Final Security Check' as verification,
  tablename,
  policyname,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;