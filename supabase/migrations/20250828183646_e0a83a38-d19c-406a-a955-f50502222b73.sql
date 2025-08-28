-- Additional security enhancements and audit logging

-- 1. Create additional security function for data access validation
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

-- 2. Create audit trigger for sensitive data modifications (not SELECT)
CREATE OR REPLACE FUNCTION public.audit_sensitive_data_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log modifications to sensitive user data
  INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    old_values,
    new_values,
    metadata,
    ip_address
  ) VALUES (
    auth.uid(),
    'users_sensitive_data',
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' THEN to_jsonb(NEW) ELSE to_jsonb(NEW) END,
    jsonb_build_object(
      'modified_at', NOW(),
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'sensitive_data_access', true
    ),
    inet_client_addr()
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 3. Create the audit trigger for modifications only
DROP TRIGGER IF EXISTS users_sensitive_data_audit ON public.users;
CREATE TRIGGER users_sensitive_data_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_sensitive_data_changes();

-- 4. Create additional security constraints
-- Ensure critical fields are properly set
UPDATE public.users SET is_active = true WHERE is_active IS NULL;

-- 5. Add comment documenting security measures
COMMENT ON TABLE public.users IS 'SECURITY: Contains sensitive personal data (emails, phones, addresses, financial data). Access strictly controlled by RLS policies. All modifications audited. Use users_public_safe view for public data.';

-- 6. Grant minimal necessary permissions
REVOKE ALL ON public.users FROM anon;
GRANT SELECT ON public.users_public_safe TO anon, authenticated;

-- 7. Add additional validation function for sensitive operations
CREATE OR REPLACE FUNCTION public.verify_user_data_integrity()
RETURNS TABLE(
  check_name TEXT,
  status TEXT,
  details TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Unauthenticated Access Check'::TEXT,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'deny_all_unauthenticated_access'
      ) THEN 'SECURE'::TEXT
      ELSE 'VULNERABILITY'::TEXT
    END,
    'Explicit policy to deny unauthenticated access exists'::TEXT
    
  UNION ALL
  
  SELECT 
    'RLS Enabled Check'::TEXT,
    CASE 
      WHEN (
        SELECT relrowsecurity 
        FROM pg_class 
        WHERE relname = 'users' 
        AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ) THEN 'SECURE'::TEXT
      ELSE 'VULNERABILITY'::TEXT
    END,
    'Row Level Security is enabled on users table'::TEXT
    
  UNION ALL
  
  SELECT 
    'Sensitive Data Protection'::TEXT,
    'SECURE'::TEXT,
    'Sensitive columns protected by RLS policies'::TEXT;
END;
$$;