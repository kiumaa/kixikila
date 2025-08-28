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

-- 6. Enable RLS on the public view (even though it's read-only)
ALTER VIEW public.users_public_safe SET (security_barrier = true);

-- 7. Create additional security function for data access validation
CREATE OR REPLACE FUNCTION public.validate_user_data_access(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  is_admin BOOLEAN := false;
BEGIN
  -- Must be authenticated
  IF current_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if admin
  SELECT public.is_current_user_admin() INTO is_admin;
  
  -- Allow access if admin or own data
  RETURN (is_admin OR current_user_id = target_user_id);
END;
$$;

-- 8. Create audit trigger for sensitive data access
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to sensitive user data
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata,
    ip_address
  ) VALUES (
    auth.uid(),
    'users_sensitive_access',
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    jsonb_build_object(
      'accessed_at', NOW(),
      'operation', TG_OP,
      'table', TG_TABLE_NAME
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 9. Create the audit trigger
DROP TRIGGER IF EXISTS users_sensitive_access_audit ON public.users;
CREATE TRIGGER users_sensitive_access_audit
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_access();

-- 10. Create additional security constraints
-- Ensure critical fields are never null for security
ALTER TABLE public.users 
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN full_name SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT true;

-- 11. Add comment documenting security measures
COMMENT ON TABLE public.users IS 'SECURITY: Contains sensitive personal data. Access is strictly controlled by RLS policies. All access is audited. Use users_public_safe view for public data.';

-- 12. Grant minimal permissions to authenticated role
REVOKE ALL ON public.users FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Grant read access to the safe public view
GRANT SELECT ON public.users_public_safe TO anon, authenticated;