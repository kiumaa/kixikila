-- KIXIKILA - Correção de Problemas de Segurança Críticos
-- Configuração de OTP e funcionalidades de limpeza automática

-- 1. Criar função para configurar OTP com expiração de 10 minutos
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
  
  RAISE NOTICE 'OTP expiry updated to production settings (10 minutes)';
END;
$$;

-- 2. Criar função para limpeza automática de dados expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar OTPs expirados há mais de 1 dia
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 day';
  
  RAISE NOTICE 'Expired OTPs cleaned successfully';
END;
$$;

-- 3. Executar a função de atualização imediatamente
SELECT public.update_otp_expiry_to_production();

-- 4. Executar limpeza de OTPs expirados
SELECT public.cleanup_expired_otps();

-- 5. Criar trigger para garantir que novos OTPs sempre tenham expiração de 10 minutos
CREATE OR REPLACE FUNCTION public.enforce_otp_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Garantir que novos OTPs sempre tenham expiração de 10 minutos
  IF NEW.expires_at IS NULL OR NEW.expires_at > NEW.created_at + INTERVAL '10 minutes' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '10 minutes';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver e criar novo
DROP TRIGGER IF EXISTS enforce_otp_expiry_trigger ON public.otp_codes;
CREATE TRIGGER enforce_otp_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.otp_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_otp_expiry();

-- 6. Criar função de monitoramento de segurança
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS TABLE (
  check_name TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'OTP Expiry Check'::TEXT as check_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.otp_codes 
        WHERE expires_at > created_at + INTERVAL '15 minutes'
      ) THEN 'FAIL'::TEXT
      ELSE 'PASS'::TEXT
    END as status,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.otp_codes 
        WHERE expires_at > created_at + INTERVAL '15 minutes'
      ) THEN 'OTPs with expiry > 15 minutes found'::TEXT
      ELSE 'All OTPs have safe expiry times'::TEXT
    END as details
    
  UNION ALL
  
  SELECT 
    'Expired OTPs Check'::TEXT as check_name,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.otp_codes 
        WHERE expires_at < NOW() - INTERVAL '1 day'
      ) THEN 'WARN'::TEXT
      ELSE 'PASS'::TEXT
    END as status,
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM public.otp_codes 
        WHERE expires_at < NOW() - INTERVAL '1 day'
      ) THEN 'Old expired OTPs need cleanup'::TEXT
      ELSE 'No old expired OTPs found'::TEXT
    END as details;
END;
$$;