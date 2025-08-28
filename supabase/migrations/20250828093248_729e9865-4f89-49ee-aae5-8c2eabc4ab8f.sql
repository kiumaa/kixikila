-- KIXIKILA - Configurações de Segurança para Produção (Corrigido)
-- Este script otimiza configurações para ambiente de produção

-- 1. Atualizar configuração de expiração de OTP para produção (10 minutos)
UPDATE public.otp_codes 
SET expires_at = created_at + INTERVAL '10 minutes'
WHERE expires_at > created_at + INTERVAL '1 hour';

-- 2. Limpar OTPs expirados antigos
DELETE FROM public.otp_codes 
WHERE expires_at < NOW() - INTERVAL '1 day';

-- 3. Criar índices para melhor performance (somente se não existirem)
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_type ON public.otp_codes(user_id, type);
CREATE INDEX IF NOT EXISTS idx_otp_codes_status ON public.otp_codes(status);

-- 4. Criar índices na tabela users para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_is_vip ON public.users(is_vip);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- 5. Criar tabela de audit logs para monitoramento (somente se não existir)
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

-- Enable RLS for audit_logs se ainda não estiver habilitado
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'audit_logs' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Remover política existente e recriar
DROP POLICY IF EXISTS "admin_can_view_audit_logs" ON public.audit_logs;
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
  type TEXT NOT NULL DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for notifications
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relname = 'notifications' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies for notifications (remover se existirem)
DROP POLICY IF EXISTS "users_can_view_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_can_update_own_notifications" ON public.notifications;

CREATE POLICY "users_can_view_own_notifications" ON public.notifications
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "users_can_update_own_notifications" ON public.notifications
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create index for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);