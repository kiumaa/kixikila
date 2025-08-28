-- Phase 1: Critical Security Fixes

-- 1. Additional RLS policies for configuration tables to prevent data exposure
CREATE POLICY "super_admin_only_system_configurations" 
ON public.system_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role = 'admin' 
  AND email LIKE '%@kixikila.pt'  -- Only super admins
));

CREATE POLICY "super_admin_only_security_configurations" 
ON public.security_configurations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() 
  AND role = 'admin' 
  AND email LIKE '%@kixikila.pt'  -- Only super admins
));

-- 2. Enhanced audit logging for critical tables
CREATE OR REPLACE FUNCTION public.log_critical_configuration_changes()
RETURNS TRIGGER
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, 
    entity_type, 
    entity_id, 
    action, 
    old_values, 
    new_values,
    ip_address,
    metadata
  ) VALUES (
    auth.uid(),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr(),
    jsonb_build_object(
      'critical_change', true,
      'table_name', TG_TABLE_NAME,
      'timestamp', NOW()
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to critical configuration tables
DROP TRIGGER IF EXISTS audit_system_configurations_changes ON public.system_configurations;
CREATE TRIGGER audit_system_configurations_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.system_configurations
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_configuration_changes();

DROP TRIGGER IF EXISTS audit_security_configurations_changes ON public.security_configurations;
CREATE TRIGGER audit_security_configurations_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.security_configurations
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_configuration_changes();

-- 3. Add security validation function
CREATE OR REPLACE FUNCTION public.validate_security_configuration()
RETURNS TABLE(check_name text, status text, message text)
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Configuration Table Access'::text as check_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'system_configurations' 
        AND policyname = 'super_admin_only_system_configurations'
      ) THEN 'SECURE'::text
      ELSE 'VULNERABLE'::text
    END as status,
    'Configuration tables properly secured'::text as message;
END;
$$;

-- 4. Create function to check for potential security issues
CREATE OR REPLACE FUNCTION public.security_audit_report()
RETURNS TABLE(
  issue_type text, 
  severity text, 
  description text, 
  recommendation text
)
SECURITY DEFINER 
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Exposed Configuration'::text as issue_type,
    'HIGH'::text as severity,
    'Configuration tables may expose sensitive data'::text as description,
    'Restrict access to super admin users only'::text as recommendation
  WHERE EXISTS (
    SELECT 1 FROM pg_policies p 
    JOIN pg_class c ON c.relname = p.tablename 
    WHERE c.relname IN ('system_configurations', 'security_configurations')
    AND p.policyname NOT LIKE '%super_admin%'
  );
END;
$$;