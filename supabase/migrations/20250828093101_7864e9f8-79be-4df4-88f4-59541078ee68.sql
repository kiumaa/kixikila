-- Fix security warnings: Function Search Path Mutable
-- Recreate functions with proper search_path to fix security warnings

-- 1. Fix cleanup_expired_data function with secure search_path
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 2. Fix get_system_stats function with secure search_path
CREATE OR REPLACE FUNCTION public.get_system_stats()
RETURNS TABLE (
  total_users BIGINT,
  active_users BIGINT,
  vip_users BIGINT,
  pending_otps BIGINT,
  unread_notifications BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.users WHERE is_active = true) as total_users,
    (SELECT COUNT(*) FROM public.users WHERE last_login > NOW() - INTERVAL '7 days') as active_users,
    (SELECT COUNT(*) FROM public.users WHERE is_vip = true AND vip_expiry_date > NOW()) as vip_users,
    (SELECT COUNT(*) FROM public.otp_codes WHERE status = 'pending' AND expires_at > NOW()) as pending_otps,
    (SELECT COUNT(*) FROM public.notifications WHERE read = false) as unread_notifications;
END;
$$;

-- 3. Fix existing update_updated_at_column function with secure search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 4. Fix handle_new_user function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;