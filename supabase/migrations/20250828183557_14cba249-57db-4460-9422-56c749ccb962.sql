-- SECURITY FIX: Comprehensive protection for users table personal data
-- This migration addresses the security concern about potential data exposure

-- 1. First, drop existing policies to rebuild them more securely
DROP POLICY IF EXISTS "admins_can_delete_users" ON public.users;
DROP POLICY IF EXISTS "admins_can_update_users" ON public.users; 
DROP POLICY IF EXISTS "admins_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "users_can_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "users_can_update_own_profile_basic" ON public.users;
DROP POLICY IF EXISTS "users_can_view_own_basic_profile" ON public.users;

-- 2. Create explicit DENY policy for unauthenticated users on ALL operations
CREATE POLICY "deny_all_unauthenticated_access" 
ON public.users 
FOR ALL 
TO anon 
USING (false) 
WITH CHECK (false);

-- 3. Recreate policies with proper role restrictions (authenticated only)
CREATE POLICY "authenticated_users_can_view_own_profile" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "authenticated_users_can_insert_own_profile" 
ON public.users 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

CREATE POLICY "authenticated_users_can_update_own_profile" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Admin policies (more restrictive)
CREATE POLICY "authenticated_admins_can_view_all_users" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (is_current_user_admin());

CREATE POLICY "authenticated_admins_can_update_users" 
ON public.users 
FOR UPDATE 
TO authenticated 
USING (is_current_user_admin())
WITH CHECK (is_current_user_admin());

CREATE POLICY "authenticated_admins_can_delete_users" 
ON public.users 
FOR DELETE 
TO authenticated 
USING (is_current_user_admin());

-- 5. Create a public safe view with minimal data for public access
CREATE OR REPLACE VIEW public.users_public_safe AS
SELECT 
  id,
  -- Only safe, non-sensitive data
  CASE 
    WHEN full_name IS NOT NULL THEN SUBSTRING(full_name FROM 1 FOR 1) || '***'
    ELSE 'Anonymous'
  END as display_name,
  -- Masked email 
  CASE 
    WHEN email IS NOT NULL THEN SUBSTRING(email FROM 1 FOR 3) || '***@' || SPLIT_PART(email, '@', 2)
    ELSE NULL
  END as masked_email,
  city,
  country,
  avatar_url,
  trust_score,
  is_vip,
  created_at
FROM public.users
WHERE is_active = true;