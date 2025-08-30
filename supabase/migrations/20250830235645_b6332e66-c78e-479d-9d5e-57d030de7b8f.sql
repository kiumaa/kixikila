-- Corrigir tabela otp_codes para suportar Twilio SIDs maiores
ALTER TABLE public.otp_codes 
ALTER COLUMN code TYPE VARCHAR(50);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_phone_type ON public.otp_codes(user_id, type) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_cleanup ON public.otp_codes(expires_at) WHERE status IN ('pending', 'expired');

-- Limpar OTPs antigos/expirados
DELETE FROM public.otp_codes 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- Adicionar trigger para limpeza automática de OTPs expirados
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Limpar OTPs expirados há mais de 1 hora
  DELETE FROM public.otp_codes 
  WHERE expires_at < NOW() - INTERVAL '1 hour'
  AND status IN ('pending', 'expired');
  
  RAISE NOTICE 'Expired OTPs cleaned successfully';
END;
$$;