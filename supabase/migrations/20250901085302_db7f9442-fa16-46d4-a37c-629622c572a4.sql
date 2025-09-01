-- Inserir dados de teste adicionais (evitando duplicatas)
INSERT INTO groups (
  id, name, description, group_type, status, creator_id,
  contribution_amount, max_members, current_members, total_pool,
  is_private, requires_approval, start_date, next_payout_date
) 
SELECT 
  '660e8400-e29b-41d4-a716-446655440001', 
  'Poupança Familiar Teste', 
  'Grupo para teste de funcionalidades', 
  'savings', 
  'active', 
  u.id,
  100.00, 8, 1, 100.00, false, true, now(), now() + interval '1 month'
FROM users u 
WHERE u.role = 'admin' 
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- Inserir configurações de sistema necessárias
INSERT INTO system_configurations (
  config_key, config_value, config_type, description, is_sensitive
) VALUES 
  ('test_mode_enabled', 'true', 'testing', 'Modo de teste habilitado', false),
  ('security_audit_passed', 'false', 'security', 'Status da auditoria de segurança', false)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now();