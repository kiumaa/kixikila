-- Fix remaining function search path security warnings

-- Update any remaining functions that don't have secure search paths set
-- This addresses the security linter warnings about mutable search paths

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  INSERT INTO public.users (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Limpar OTPs expirados há mais de 24 horas
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  -- Limpar notificações lidas há mais de 30 dias
  DELETE FROM public.notifications 
  WHERE read = true AND updated_at < NOW() - INTERVAL '30 days';
  
  -- Limpar audit logs com mais de 90 dias
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  RAISE NOTICE 'Cleanup completed successfully';
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE(total_users bigint, active_users bigint, vip_users bigint, pending_otps bigint, unread_notifications bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.users WHERE is_active = true) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE last_login > NOW() - INTERVAL '7 days') as active_users,
    (SELECT COUNT(*) FROM public.users WHERE is_vip = true AND vip_expiry_date > NOW()) as vip_users,
    (SELECT COUNT(*) FROM public.otp_codes WHERE status = 'pending' AND expires_at > NOW()) as pending_otps,
    (SELECT COUNT(*) FROM public.notifications WHERE read = false) as unread_notifications;
END;
$function$;

CREATE OR REPLACE FUNCTION public.encrypt_financial_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
    -- Log any financial data changes
    IF TG_OP = 'UPDATE' AND (
        OLD.wallet_balance != NEW.wallet_balance OR
        OLD.total_earned != NEW.total_earned OR
        OLD.total_withdrawn != NEW.total_withdrawn OR
        OLD.total_saved != NEW.total_saved
    ) THEN
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
            'users_financial_data',
            NEW.id::text,
            'financial_data_update',
            jsonb_build_object(
                'wallet_balance', OLD.wallet_balance,
                'total_earned', OLD.total_earned,
                'total_withdrawn', OLD.total_withdrawn,
                'total_saved', OLD.total_saved
            ),
            jsonb_build_object(
                'wallet_balance', NEW.wallet_balance,
                'total_earned', NEW.total_earned,
                'total_withdrawn', NEW.total_withdrawn,
                'total_saved', NEW.total_saved
            ),
            jsonb_build_object(
                'high_sensitivity_operation', true,
                'data_type', 'financial',
                'timestamp', NOW()
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_sensitive_data_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.log_otp_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
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
$function$;

CREATE OR REPLACE FUNCTION public.enforce_otp_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Garantir que novos OTPs sempre tenham expiração de 10 minutos
  IF NEW.expires_at IS NULL OR NEW.expires_at > NEW.created_at + INTERVAL '10 minutes' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '10 minutes';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create a function to check if all functions now have secure search paths
CREATE OR REPLACE FUNCTION public.verify_function_security_compliance()
RETURNS TABLE(
    function_name text,
    search_path_secure boolean,
    security_definer boolean,
    compliance_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.proname::text as function_name,
        (p.proconfig IS NOT NULL AND 'search_path=public,extensions' = ANY(p.proconfig)) as search_path_secure,
        p.prosecdef as security_definer,
        CASE 
            WHEN p.proconfig IS NOT NULL AND 'search_path=public,extensions' = ANY(p.proconfig) AND p.prosecdef 
            THEN 'COMPLIANT'::text
            WHEN p.prosecdef AND (p.proconfig IS NULL OR NOT ('search_path=public,extensions' = ANY(p.proconfig)))
            THEN 'SECURITY_DEFINER_WITHOUT_SECURE_PATH'::text
            ELSE 'NON_SECURITY_DEFINER'::text
        END as compliance_status
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prosecdef = true -- Only security definer functions need secure search paths
    ORDER BY p.proname;
END;
$function$;