-- ==============================================================================
-- FASE 3: CORREÇÕES CRÍTICAS DE SEGURANÇA E CONFIGURAÇÕES DE PRODUÇÃO
-- ==============================================================================

-- 3.1 CORREÇÃO CRÍTICA: Políticas RLS Conflitantes na Tabela Users
-- ==============================================================================

-- Remover políticas conflitantes e duplicadas
DROP POLICY IF EXISTS "users_deny_all_unauthenticated" ON public.users;
DROP POLICY IF EXISTS "deny_unauthenticated_user_access" ON public.users;
DROP POLICY IF EXISTS "users_service_role_system_only" ON public.users;

-- Política consolidada de negação para não autenticados
CREATE POLICY "deny_all_unauthenticated_access" ON public.users
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Política de acesso próprio para usuários autenticados
CREATE POLICY "users_can_access_own_data" ON public.users
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Política de acesso total para admins
CREATE POLICY "admins_full_access" ON public.users
FOR ALL
TO authenticated
USING (public.is_current_user_admin())
WITH CHECK (public.is_current_user_admin());

-- 3.2 CORREÇÃO: Controle de Acesso Melhorado para Transactions
-- ==============================================================================

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "users_can_view_group_transactions" ON public.transactions;
DROP POLICY IF EXISTS "users_can_update_own_pending_transactions" ON public.transactions;

-- Nova política para visualização de transações de grupo (mais restritiva)
CREATE POLICY "users_can_view_group_transactions_secure" ON public.transactions
FOR SELECT
TO authenticated
USING (
  group_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = transactions.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.status = 'active'
  )
  AND status IN ('completed', 'pending')
);

-- Política restrita para atualização (somente status pending e próprias transações)
CREATE POLICY "users_can_update_own_pending_transactions_secure" ON public.transactions
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  AND status = 'pending'
  AND created_at > NOW() - INTERVAL '24 hours'
)
WITH CHECK (
  user_id = auth.uid() 
  AND status IN ('pending', 'cancelled')
);

-- 3.3 CONFIGURAÇÕES DE PRODUÇÃO: Triggers de Segurança
-- ==============================================================================

-- Trigger para auditoria de mudanças críticas em users
DROP TRIGGER IF EXISTS audit_users_changes ON public.users;
CREATE TRIGGER audit_users_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.encrypt_financial_data();

-- Trigger para auditoria de transações
DROP TRIGGER IF EXISTS audit_transaction_changes ON public.transactions;
CREATE TRIGGER audit_transaction_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.log_critical_configuration_changes();

-- Trigger para controle de expiração de OTP
DROP TRIGGER IF EXISTS enforce_otp_expiry_trigger ON public.otp_codes;
CREATE TRIGGER enforce_otp_expiry_trigger
  BEFORE INSERT OR UPDATE ON public.otp_codes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_otp_expiry();

-- 3.4 TABELA DE CONFIGURAÇÕES DE SEGURANÇA EM PRODUÇÃO
-- ==============================================================================

-- Inserir configurações de produção na tabela security_configurations
INSERT INTO public.security_configurations (
  rate_limit_login,
  rate_limit_api,
  rate_limit_window_minutes,
  password_min_length,
  password_require_uppercase,
  password_require_lowercase,
  password_require_numbers,
  password_require_symbols,
  session_timeout_minutes,
  max_concurrent_sessions,
  two_factor_required,
  suspicious_activity_threshold,
  created_at,
  updated_at
) VALUES (
  5,      -- rate_limit_login (5 tentativas)
  100,    -- rate_limit_api (100 requests por janela)
  15,     -- rate_limit_window_minutes (15 minutos)
  8,      -- password_min_length
  true,   -- password_require_uppercase
  true,   -- password_require_lowercase
  true,   -- password_require_numbers
  false,  -- password_require_symbols (opcional)
  1440,   -- session_timeout_minutes (24 horas)
  3,      -- max_concurrent_sessions
  false,  -- two_factor_required (opcional por enquanto)
  10,     -- suspicious_activity_threshold
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  updated_at = NOW();

-- 3.5 CONFIGURAÇÕES DE SISTEMA PARA PRODUÇÃO
-- ==============================================================================

-- Configurações críticas do sistema
INSERT INTO public.system_configurations (config_key, config_value, config_type, is_sensitive, description) VALUES 
('otp_expiry_minutes', '10', 'security', true, 'OTP expiration time in minutes'),
('max_login_attempts', '5', 'security', false, 'Maximum login attempts before lockout'),
('session_timeout_hours', '24', 'security', false, 'User session timeout in hours'),
('file_upload_max_size_mb', '10', 'system', false, 'Maximum file upload size in MB'),
('maintenance_mode', 'false', 'system', false, 'System maintenance mode flag'),
('backup_retention_days', '30', 'system', false, 'Backup retention period in days')
ON CONFLICT (config_key) DO UPDATE SET 
  config_value = EXCLUDED.config_value,
  updated_at = NOW();

-- 3.6 ÍNDICES DE PERFORMANCE PARA PRODUÇÃO
-- ==============================================================================

-- Índices críticos para performance em produção
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON public.users(email) WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone_verified 
ON public.users(phone) WHERE phone_verified = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_status_date 
ON public.transactions(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_group_status 
ON public.transactions(group_id, status) WHERE group_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otp_codes_user_type_status 
ON public.otp_codes(user_id, type, status) WHERE status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_date 
ON public.audit_logs(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_user_status 
ON public.group_members(user_id, status) WHERE status = 'active';

-- 3.7 FUNÇÃO DE HEALTH CHECK COMPLETA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.production_health_check()
RETURNS TABLE(
  component text,
  status text,
  details text,
  last_check timestamptz
) LANGUAGE plpgsql SECURITY DEFINER AS $$
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
$$;

-- 3.8 FUNÇÃO DE LIMPEZA AUTOMÁTICA MELHORADA
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.automated_cleanup_production()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
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
$$;

-- 3.9 VALIDAÇÕES FINAIS DE SEGURANÇA
-- ==============================================================================

-- Garantir que RLS está ativo em todas as tabelas críticas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Comentários para documentação
COMMENT ON FUNCTION public.production_health_check() IS 'Comprehensive health check for production environment';
COMMENT ON FUNCTION public.automated_cleanup_production() IS 'Automated cleanup for production data maintenance';
COMMENT ON TABLE public.system_configurations IS 'Production system configuration settings';
COMMENT ON TABLE public.security_configurations IS 'Production security policy settings';