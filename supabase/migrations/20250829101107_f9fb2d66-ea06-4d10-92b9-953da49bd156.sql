-- Fix the remaining functions without proper search_path configuration
-- These are the exact functions causing the security warnings

CREATE OR REPLACE FUNCTION public.automated_cleanup_production()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  -- Limpar OTPs expirados há mais de 1 hora
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
  
  -- Limpar notificações lidas há mais de 7 dias
  DELETE FROM public.notifications 
  WHERE read = true AND updated_at < NOW() - INTERVAL '7 days';
  
  -- Limpar logs de auditoria antigos (manter 90 dias)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days'
  AND action NOT IN ('login', 'financial_update', 'security_event');
  
  -- Log da operação de limpeza
  INSERT INTO public.audit_logs (
    user_id, entity_type, entity_id, action, metadata
  ) VALUES (
    null, 'system', 'cleanup', 'automated_cleanup',
    jsonb_build_object(
      'timestamp', NOW(),
      'operation', 'production_cleanup',
      'automated', true
    )
  );
  
  RAISE NOTICE 'Production cleanup completed successfully';
END;
$function$;

CREATE OR REPLACE FUNCTION public.production_health_check()
RETURNS TABLE(component text, status text, details text, last_check timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
BEGIN
  RETURN QUERY
  -- Database connectivity
  SELECT 
    'Database'::text,
    'HEALTHY'::text,
    'Database is accessible'::text,
    NOW()
  
  UNION ALL
  
  -- OTP Security Check
  SELECT 
    'OTP Security'::text,
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.otp_codes WHERE expires_at > created_at + INTERVAL '15 minutes') 
      THEN 'WARNING'::text
      ELSE 'HEALTHY'::text
    END,
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.otp_codes WHERE expires_at > created_at + INTERVAL '15 minutes')
      THEN 'Long OTP expiry detected'::text
      ELSE 'OTP expiry times are secure'::text
    END,
    NOW()
  
  UNION ALL
  
  -- User Authentication
  SELECT 
    'Authentication'::text,
    CASE 
      WHEN EXISTS (SELECT 1 FROM public.users WHERE is_active = true)
      THEN 'HEALTHY'::text
      ELSE 'ERROR'::text
    END,
    CONCAT('Active users: ', (SELECT COUNT(*) FROM public.users WHERE is_active = true))::text,
    NOW()
  
  UNION ALL
  
  -- Transaction System
  SELECT 
    'Transactions'::text,
    'HEALTHY'::text,
    CONCAT('Total transactions: ', (SELECT COUNT(*) FROM public.transactions))::text,
    NOW();
END;
$function$;

-- Verify that all security definer functions now have proper search paths
SELECT 
    COUNT(*) as total_security_definer_functions,
    COUNT(CASE WHEN proconfig IS NOT NULL AND 'search_path=public,extensions' = ANY(proconfig) THEN 1 END) as functions_with_secure_path,
    COUNT(CASE WHEN proconfig IS NULL OR NOT ('search_path=public,extensions' = ANY(proconfig)) THEN 1 END) as functions_needing_fix
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.prosecdef = true;