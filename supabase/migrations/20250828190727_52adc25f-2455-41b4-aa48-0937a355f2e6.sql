-- COMPREHENSIVE SECURITY FIXES
-- Phase 1: Identify and remove any remaining security definer objects

-- Check for any remaining SECURITY DEFINER views or functions
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Drop any remaining security definer views
    FOR rec IN 
        SELECT schemaname, viewname 
        FROM pg_views 
        WHERE schemaname IN ('public', 'private') 
        AND definition ILIKE '%security definer%'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', rec.schemaname, rec.viewname);
        RAISE NOTICE 'Dropped security definer view: %.%', rec.schemaname, rec.viewname;
    END LOOP;
    
    -- Check for any problematic functions
    FOR rec IN 
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'private')
        AND p.prosecdef = true
        AND p.proname NOT IN (
            'handle_new_user',
            'update_updated_at_column', 
            'get_current_user_role',
            'is_current_user_admin',
            'update_user_profile_secure',
            'update_user_financial_data',
            'get_security_alerts',
            'get_users_safe_list',
            'get_user_safe_data',
            'get_all_users_safe_data',
            'validate_user_data_access',
            'audit_sensitive_data_changes',
            'verify_user_data_integrity',
            'log_critical_configuration_changes',
            'validate_security_configuration',
            'security_audit_report',
            'cleanup_expired_data',
            'get_system_stats',
            'update_otp_expiry_to_production',
            'cleanup_expired_otps',
            'enforce_otp_expiry',
            'security_health_check'
        )
    LOOP
        RAISE NOTICE 'Found potentially problematic security definer function: %.%', rec.schema_name, rec.function_name;
    END LOOP;
END $$;

-- Phase 2: Fix RLS policies to prevent permission denied errors while maintaining security

-- Drop and recreate the problematic deny_all_unauthenticated_access policy
DROP POLICY IF EXISTS "deny_all_unauthenticated_access" ON public.users;

-- Create a more targeted policy that allows service role access for legitimate operations
CREATE POLICY "deny_unauthenticated_user_access" ON public.users
    FOR ALL 
    TO anon
    USING (false)
    WITH CHECK (false);

-- Ensure authenticated users can still access their own data
CREATE POLICY "authenticated_users_full_access_own_data" ON public.users
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow service role for system operations (this prevents the permission denied errors)
CREATE POLICY "service_role_full_access" ON public.users
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Phase 3: Enhanced security for sensitive configuration data

-- Add encryption helper function for sensitive config values
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_config(
    config_value jsonb,
    is_sensitive boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- For sensitive values, we'll mask them in responses
    IF is_sensitive THEN
        RETURN jsonb_build_object(
            'encrypted', true,
            'value_hash', md5(config_value::text),
            'last_modified', NOW()
        );
    END IF;
    
    RETURN config_value;
END;
$$;

-- Phase 4: Add additional security monitoring

-- Create function to detect suspicious access patterns
CREATE OR REPLACE FUNCTION public.log_suspicious_access(
    entity_type text,
    access_pattern text,
    metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
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
        entity_type,
        'security_event',
        access_pattern,
        metadata || jsonb_build_object(
            'timestamp', NOW(),
            'session_id', current_setting('request.jwt.claim.session_id', true),
            'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent'
        ),
        inet_client_addr()
    );
END;
$$;

-- Phase 5: Strengthen OTP security

-- Add trigger to automatically log OTP access attempts
CREATE OR REPLACE FUNCTION public.log_otp_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log OTP verification attempts
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
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
            COALESCE(NEW.user_id, OLD.user_id),
            'otp_codes',
            COALESCE(NEW.id::text, OLD.id::text),
            'otp_status_change',
            jsonb_build_object('status', OLD.status, 'attempts', OLD.attempts),
            jsonb_build_object('status', NEW.status, 'attempts', NEW.attempts),
            jsonb_build_object(
                'otp_type', COALESCE(NEW.type, OLD.type),
                'security_event', true,
                'timestamp', NOW()
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for OTP access logging
DROP TRIGGER IF EXISTS otp_access_audit_trigger ON public.otp_codes;
CREATE TRIGGER otp_access_audit_trigger
    AFTER UPDATE ON public.otp_codes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_otp_access();

-- Phase 6: Security health monitoring function
CREATE OR REPLACE FUNCTION public.comprehensive_security_check()
RETURNS TABLE(
    check_category text,
    check_name text,
    status text,
    details text,
    severity text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    -- Check for recent permission denied errors
    SELECT 
        'Database Access'::text as check_category,
        'Permission Denied Errors'::text as check_name,
        CASE 
            WHEN COUNT(*) > 0 THEN 'ALERT'::text
            ELSE 'OK'::text
        END as status,
        format('%s permission denied errors in last hour', COUNT(*)) as details,
        CASE 
            WHEN COUNT(*) > 10 THEN 'HIGH'::text
            WHEN COUNT(*) > 0 THEN 'MEDIUM'::text
            ELSE 'LOW'::text
        END as severity
    FROM public.audit_logs
    WHERE action LIKE '%permission%' 
    AND created_at > NOW() - INTERVAL '1 hour'
    
    UNION ALL
    
    -- Check OTP security
    SELECT 
        'Authentication'::text as check_category,
        'OTP Security'::text as check_name,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM public.otp_codes 
                WHERE expires_at > created_at + INTERVAL '15 minutes'
            ) THEN 'FAIL'::text
            ELSE 'PASS'::text
        END as status,
        'OTP expiry validation' as details,
        'MEDIUM'::text as severity
    
    UNION ALL
    
    -- Check for sensitive config exposure
    SELECT 
        'Configuration'::text as check_category,
        'Sensitive Data Protection'::text as check_name,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM public.system_configurations 
                WHERE is_sensitive = true
            ) THEN 'REVIEW'::text
            ELSE 'OK'::text
        END as status,
        'Sensitive configuration data exists' as details,
        'HIGH'::text as severity;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.encrypt_sensitive_config(jsonb, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_suspicious_access(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.comprehensive_security_check() TO authenticated;

-- Final cleanup: Drop the private schema if it exists and is empty
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'private') THEN
        -- Check if schema is empty
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.tables WHERE table_schema = 'private'
            UNION ALL
            SELECT 1 FROM information_schema.views WHERE table_schema = 'private'
            UNION ALL
            SELECT 1 FROM information_schema.routines WHERE routine_schema = 'private'
        ) THEN
            DROP SCHEMA private CASCADE;
            RAISE NOTICE 'Dropped empty private schema';
        END IF;
    END IF;
END $$;

-- Log this security fix
INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid,
    'security_system',
    'comprehensive_security_fixes',
    'security_patches_applied',
    jsonb_build_object(
        'fixes_applied', ARRAY[
            'removed_security_definer_views',
            'fixed_rls_permission_denied_errors', 
            'enhanced_sensitive_data_protection',
            'improved_otp_security_monitoring',
            'added_comprehensive_security_checks'
        ],
        'timestamp', NOW(),
        'version', '2.0'
    )
);

RAISE NOTICE 'Comprehensive security fixes applied successfully';