-- FASE 1: Hardening de Segurança - Configurar OTP expiry mais seguro
-- Atualizar configurações de OTP para produção (5-10 minutos)
CREATE OR REPLACE FUNCTION update_otp_expiry_to_production()
RETURNS void AS $$
BEGIN
  -- Atualizar todos os OTPs existentes com validade muito longa para 10 minutos
  UPDATE public.otp_codes 
  SET expires_at = created_at + INTERVAL '10 minutes'
  WHERE expires_at > created_at + INTERVAL '1 hour';
  
  -- Criar índice para melhor performance em queries de OTP
  CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
  CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type ON public.otp_codes(user_id, type);
  
  -- Função para limpeza automática de OTPs expirados
  CREATE OR REPLACE FUNCTION cleanup_expired_otps()
  RETURNS void AS $cleanup$
  BEGIN
    DELETE FROM public.otp_codes 
    WHERE expires_at < NOW() - INTERVAL '1 day';
  END;
  $cleanup$ LANGUAGE plpgsql SECURITY DEFINER;
  
END;
$$ LANGUAGE plpgsql;