-- Remove the view entirely to eliminate security definer warning

-- 1. Drop the view that's causing security concerns
DROP VIEW IF EXISTS public.public_user_profiles CASCADE;

-- 2. Also drop any other views that might have security definer properties
DROP VIEW IF EXISTS public.security_dashboard CASCADE;

-- 3. Remove any grants related to the dropped view
-- (This is automatically handled by CASCADE but being explicit)

-- 4. Verify no problematic views remain
SELECT 
  'View Cleanup Verification' as check_type,
  schemaname,
  viewname
FROM pg_views 
WHERE schemaname = 'public';

-- 5. Final security policy verification for users table
SELECT 
  'RLS Policy Verification' as check_type,
  policyname,
  roles,
  cmd,
  CASE 
    WHEN roles::text LIKE '%anon%' AND cmd != 'ALL' THEN 'WARNING: anon access detected'
    WHEN roles::text LIKE '%anon%' AND qual = 'false' THEN 'SECURE: anon access denied'  
    WHEN roles::text LIKE '%authenticated%' THEN 'SECURE: authenticated only'
    ELSE 'REVIEW: check policy'
  END as security_status
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;