-- KIXIKILA - Configurações de Segurança para Produção
-- Este script otimiza configurações para ambiente de produção

-- 1. Atualizar configuração de expiração de OTP para produção (10 minutos)
UPDATE public.otp_codes 
SET expires_at = created_at + INTERVAL '10 minutes'
WHERE expires_at > created_at + INTERVAL '1 hour';

-- 2. Limpar OTPs expirados antigos
DELETE FROM public.otp_codes 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type ON public.otp_codes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_status ON public.otp_codes(status);

-- 4. Criar índices na tabela users para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_vip ON public.users(is_vip);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- 5. Criar tabela de audit logs para monitoramento
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for audit logs (only admins can read)
CREATE POLICY "admin_can_view_audit_logs" ON public.audit_logs
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

-- 6. Criar tabela de notificações para o sistema
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- info, success, warning, error
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "users_can_view_own_notifications" ON public.notifications
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications" ON public.notifications
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 7. Criar trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Criar função para limpeza automática de dados expirados
CREATE OR REPLACE FUNCTION public.cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 9. Criar função de estatísticas do sistema
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