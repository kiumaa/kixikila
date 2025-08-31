-- Limpar OTPs expirados
DELETE FROM otp_codes WHERE expires_at < NOW() AND status = 'pending';

-- Criar função de limpeza automática
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$;