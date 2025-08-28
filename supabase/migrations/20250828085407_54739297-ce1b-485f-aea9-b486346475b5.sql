-- Corrigir problemas de segurança identificados pelo linter

-- 1. Fix Function Search Path Mutable - adicionar SET search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_otp_expiry_to_production()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Atualizar todos os OTPs existentes com validade muito longa para 10 minutos
  UPDATE public.otp_codes 
  SET expires_at = created_at + INTERVAL '10 minutes'
  WHERE expires_at > created_at + INTERVAL '1 hour';
  
  -- Criar índice para melhor performance em queries de OTP
  CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
  CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type ON public.otp_codes(user_id, type);
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$function$;

-- Executar a função para atualizar OTPs existentes
SELECT public.update_otp_expiry_to_production();