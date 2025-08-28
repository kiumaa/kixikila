-- ==============================================================================
-- KIXIKILA - PRODUCTION PERFORMANCE INDEXES
-- ==============================================================================
-- 
-- Este script deve ser executado SEPARADAMENTE no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/sql/new
--
-- IMPORTANTE: Execute estes comandos UM POR VEZ para evitar problemas de transação
-- ==============================================================================

-- 1. ÍNDICES PARA PERFORMANCE DE USERS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_active 
ON public.users(email) WHERE is_active = true;

-- 2. ÍNDICE PARA TELEFONES VERIFICADOS  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone_verified 
ON public.users(phone) WHERE phone_verified = true;

-- 3. ÍNDICE PARA TRANSAÇÕES POR USUÁRIO E STATUS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_status_date 
ON public.transactions(user_id, status, created_at DESC);

-- 4. ÍNDICE PARA TRANSAÇÕES DE GRUPO
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_group_status 
ON public.transactions(group_id, status) WHERE group_id IS NOT NULL;

-- 5. ÍNDICE PARA OTPS PENDENTES
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_otp_codes_user_type_status 
ON public.otp_codes(user_id, type, status) WHERE status = 'pending';

-- 6. ÍNDICE PARA LOGS DE AUDITORIA
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user_date 
ON public.audit_logs(user_id, created_at DESC);

-- 7. ÍNDICE PARA MEMBROS ATIVOS DE GRUPOS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_members_user_status 
ON public.group_members(user_id, status) WHERE status = 'active';

-- 8. ÍNDICE PARA GRUPOS POR CRIADOR E STATUS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_groups_creator_status 
ON public.groups(creator_id, status);

-- 9. ÍNDICE PARA NOTIFICAÇÕES NÃO LIDAS
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications(user_id, read) WHERE read = false;

-- 10. ÍNDICE PARA CONFIGURAÇÕES DE SISTEMA
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_system_configs_type_key 
ON public.system_configurations(config_type, config_key);

-- ==============================================================================
-- COMANDOS DE VERIFICAÇÃO (Executar após criar os índices)
-- ==============================================================================

-- Verificar todos os índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verificar tamanho dos índices
SELECT 
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ==============================================================================
-- NOTAS IMPORTANTES:
-- ==============================================================================
-- 
-- 1. Execute cada comando CREATE INDEX CONCURRENTLY individualmente
-- 2. CONCURRENTLY permite criar índices sem bloquear a tabela
-- 3. Monitore o progresso em Activity Monitor do Supabase
-- 4. Em caso de erro, remova o índice e tente novamente:
--    DROP INDEX CONCURRENTLY IF EXISTS nome_do_indice;
-- 
-- ==============================================================================