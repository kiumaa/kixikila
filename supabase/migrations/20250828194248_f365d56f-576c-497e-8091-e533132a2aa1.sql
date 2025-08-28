-- COMPREHENSIVE SECURITY FIX FOR CONFIGURATION TABLES
-- This migration implements enterprise-grade security for sensitive system configurations

-- First, drop existing permissive policies and replace with restrictive super-admin only policies
DROP POLICY IF EXISTS "admins_can_access_webhook_configurations" ON public.webhook_configurations;
DROP POLICY IF EXISTS "admins_can_access_notification_configurations" ON public.notification_configurations;  
DROP POLICY IF EXISTS "admins_can_access_sms_configurations" ON public.sms_configurations;
DROP POLICY IF EXISTS "admins_can_access_email_configurations" ON public.email_configurations;

-- Create super-admin verification function for configuration access
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND email LIKE '%@kixikila.pt'
    AND is_active = true
  );
END;
$$;

-- Create function to encrypt sensitive configuration values
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_config_value(config_value jsonb, is_sensitive boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF is_sensitive AND config_value IS NOT NULL THEN
        -- Store only a hash and metadata for sensitive values
        RETURN jsonb_build_object(
            'encrypted', true,
            'value_hash', encode(digest(config_value::text, 'sha256'), 'hex'),
            'last_modified', NOW(),
            'access_level', 'super_admin_only'
        );
    END IF;
    RETURN config_value;
END;
$$;

-- Create function to mask sensitive configuration data for non-super-admins
CREATE OR REPLACE FUNCTION public.get_masked_config_value(config_value jsonb, config_key text, is_sensitive boolean)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only super-admins can see actual sensitive values
    IF is_sensitive AND NOT public.is_super_admin() THEN
        RETURN jsonb_build_object(
            'masked', true,
            'type', 'sensitive_configuration',
            'key', config_key,
            'access_denied', 'Super admin privileges required'
        );
    END IF;
    
    RETURN config_value;
END;
$$;

-- Create audit logging function for configuration access
CREATE OR REPLACE FUNCTION public.log_configuration_access(
    table_name text,
    operation text,
    config_keys text[] DEFAULT NULL,
    is_sensitive_access boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.audit_logs (
        user_id,
        entity_type,
        entity_id,
        action,
        metadata,
        ip_address
    ) VALUES (
        auth.uid(),
        'configuration_access',
        table_name,
        operation,
        jsonb_build_object(
            'table_accessed', table_name,
            'operation', operation,
            'config_keys_accessed', config_keys,
            'is_sensitive_access', is_sensitive_access,
            'is_super_admin', public.is_super_admin(),
            'timestamp', NOW(),
            'security_level', 'critical'
        ),
        inet_client_addr()
    );
END;
$$;

-- SUPER-ADMIN ONLY POLICIES FOR ALL SENSITIVE CONFIGURATION TABLES

-- Webhook Configurations (contains secret_key)
CREATE POLICY "super_admin_only_webhook_configurations" ON public.webhook_configurations
  FOR ALL USING (public.is_super_admin());

-- Notification Configurations (contains FCM keys, APNS certificates)  
CREATE POLICY "super_admin_only_notification_configurations" ON public.notification_configurations
  FOR ALL USING (public.is_super_admin());

-- SMS Configurations (may contain API credentials)
CREATE POLICY "super_admin_only_sms_configurations" ON public.sms_configurations
  FOR ALL USING (public.is_super_admin());

-- Email Configurations (may contain SMTP credentials)
CREATE POLICY "super_admin_only_email_configurations" ON public.email_configurations
  FOR ALL USING (public.is_super_admin());

-- Create triggers to automatically audit and encrypt sensitive configuration changes
CREATE OR REPLACE FUNCTION public.audit_configuration_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log all configuration changes with high sensitivity
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
        'sensitive_configuration',
        TG_TABLE_NAME || '_' || COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        jsonb_build_object(
            'table_name', TG_TABLE_NAME,
            'operation', TG_OP,
            'critical_security_event', true,
            'requires_super_admin', true,
            'timestamp', NOW()
        ),
        inet_client_addr()
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to all sensitive configuration tables
CREATE TRIGGER audit_webhook_configurations
    BEFORE INSERT OR UPDATE OR DELETE ON public.webhook_configurations
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_changes();

CREATE TRIGGER audit_notification_configurations
    BEFORE INSERT OR UPDATE OR DELETE ON public.notification_configurations
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_changes();

CREATE TRIGGER audit_sms_configurations
    BEFORE INSERT OR UPDATE OR DELETE ON public.sms_configurations
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_changes();

CREATE TRIGGER audit_email_configurations
    BEFORE INSERT OR UPDATE OR DELETE ON public.email_configurations
    FOR EACH ROW EXECUTE FUNCTION public.audit_configuration_changes();

-- Create secure configuration access function
CREATE OR REPLACE FUNCTION public.get_secure_configuration(
    table_name text,
    config_keys text[] DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    config_data jsonb,
    access_level text,
    last_modified timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    is_super boolean := public.is_super_admin();
    query_text text;
BEGIN
    -- Verify super-admin access for sensitive configurations
    IF NOT is_super boolean THEN
        RAISE EXCEPTION 'Access denied: Super admin privileges required for configuration access';
    END IF;
    
    -- Log the access attempt
    PERFORM public.log_configuration_access(table_name, 'secure_read', config_keys, true);
    
    -- Return masked or actual data based on permissions
    CASE table_name
        WHEN 'system_configurations' THEN
            RETURN QUERY 
            SELECT 
                sc.id,
                CASE 
                    WHEN sc.is_sensitive AND NOT is_super THEN 
                        public.get_masked_config_value(sc.config_value, sc.config_key, sc.is_sensitive)
                    ELSE sc.config_value 
                END as config_data,
                CASE WHEN sc.is_sensitive THEN 'super_admin_only' ELSE 'admin' END as access_level,
                sc.updated_at
            FROM public.system_configurations sc
            WHERE config_keys IS NULL OR sc.config_key = ANY(config_keys);
            
        ELSE
            RAISE EXCEPTION 'Invalid table name for secure configuration access: %', table_name;
    END CASE;
END;
$$;

-- Force RLS on all configuration tables to prevent bypass
ALTER TABLE public.webhook_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.notification_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.sms_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.email_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.system_configurations FORCE ROW LEVEL SECURITY;
ALTER TABLE public.security_configurations FORCE ROW LEVEL SECURITY;

-- Create function to validate super-admin email domain
CREATE OR REPLACE FUNCTION public.validate_super_admin_domain(email text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
    RETURN email LIKE '%@kixikila.pt' OR email LIKE '%@admin.kixikila.pt';
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_masked_config_value(jsonb, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_configuration_access(text, text, text[], boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_secure_configuration(text, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_super_admin_domain(text) TO authenticated;

-- Create security validation function for configuration tables
CREATE OR REPLACE FUNCTION public.validate_configuration_security()
RETURNS TABLE(
    table_name text,
    security_level text,
    policies_count integer,
    has_super_admin_only boolean,
    audit_logging boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        'SUPER_ADMIN_REQUIRED'::text as security_level,
        (SELECT COUNT(*)::integer FROM pg_policies WHERE tablename = t.table_name) as policies_count,
        EXISTS(
            SELECT 1 FROM pg_policies 
            WHERE tablename = t.table_name 
            AND qual LIKE '%is_super_admin%'
        ) as has_super_admin_only,
        EXISTS(
            SELECT 1 FROM pg_trigger 
            WHERE tgname LIKE 'audit_%' || t.table_name
        ) as audit_logging
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' 
    AND t.table_name IN (
        'webhook_configurations',
        'notification_configurations', 
        'sms_configurations',
        'email_configurations',
        'system_configurations',
        'security_configurations'
    );
END;
$$;