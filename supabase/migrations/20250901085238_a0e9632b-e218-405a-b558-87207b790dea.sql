-- Inserir dados de teste para validação de funcionalidades
-- Usuários de teste
INSERT INTO users (
  id, email, full_name, phone, role, kyc_status, 
  is_vip, wallet_balance, total_saved, trust_score, 
  phone_verified, email_verified, is_active
) VALUES 
  -- Admin de teste
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@kixikila.pt', 'Admin KIXIKILA', '+244912000001', 'admin', 'verified', true, 5000.00, 1500.00, 100, true, true, true),
  -- Usuário VIP
  ('550e8400-e29b-41d4-a716-446655440002', 'vip@example.com', 'João Silva VIP', '+244912000002', 'user', 'verified', true, 2500.00, 800.00, 95, true, true, true),
  -- Usuário regular
  ('550e8400-e29b-41d4-a716-446655440003', 'user@example.com', 'Maria Santos', '+244912000003', 'user', 'pending', false, 150.00, 300.00, 75, true, true, true),
  -- Usuário inativo
  ('550e8400-e29b-41d4-a716-446655440004', 'inactive@example.com', 'Pedro Inativo', '+244912000004', 'user', 'pending', false, 0.00, 0.00, 50, false, false, false)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  updated_at = now();

-- Grupos de teste
INSERT INTO groups (
  id, name, description, group_type, status, creator_id,
  contribution_amount, max_members, current_members, total_pool,
  is_private, requires_approval, start_date, next_payout_date
) VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'Poupança Familiar', 'Grupo para poupança familiar mensal', 'savings', 'active', '550e8400-e29b-41d4-a716-446655440002', 100.00, 8, 3, 300.00, false, true, now(), now() + interval '1 month'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Investimento Tech', 'Grupo privado para investimentos', 'investment', 'active', '550e8400-e29b-41d4-a716-446655440001', 500.00, 5, 2, 1000.00, true, true, now(), now() + interval '1 month')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Membros dos grupos
INSERT INTO group_members (
  user_id, group_id, role, status, total_contributed, current_balance, payout_position
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'creator', 'active', 100.00, 100.00, 1),
  ('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'member', 'active', 100.00, 100.00, 2),
  ('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'creator', 'active', 500.00, 500.00, 1),
  ('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'member', 'active', 500.00, 500.00, 2)
ON CONFLICT (user_id, group_id) DO UPDATE SET
  total_contributed = EXCLUDED.total_contributed,
  current_balance = EXCLUDED.current_balance,
  updated_at = now();

-- Transações de teste
INSERT INTO transactions (
  user_id, type, amount, description, status, currency, payment_method
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 'deposit', 1000.00, 'Depósito inicial', 'completed', 'EUR', 'stripe'),
  ('550e8400-e29b-41d4-a716-446655440002', 'contribution', -100.00, 'Contribuição - Poupança Familiar', 'completed', 'EUR', 'wallet'),
  ('550e8400-e29b-41d4-a716-446655440003', 'deposit', 500.00, 'Primeiro depósito', 'completed', 'EUR', 'stripe'),
  ('550e8400-e29b-41d4-a716-446655440003', 'contribution', -100.00, 'Contribuição - Poupança Familiar', 'completed', 'EUR', 'wallet'),
  ('550e8400-e29b-41d4-a716-446655440001', 'deposit', 2000.00, 'Depósito admin', 'completed', 'EUR', 'stripe');

-- Notificações de teste
INSERT INTO notifications (
  user_id, title, message, type, read
) VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 'Bem-vindo!', 'Sua conta foi criada com sucesso', 'welcome', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Pagamento Confirmado', 'Seu pagamento de €100 foi processado', 'payment', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'Convite Aceite', 'Você foi aceito no grupo Poupança Familiar', 'group_invite', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'Novo Membro', 'Maria Santos entrou no grupo Poupança Familiar', 'member_joined', false);

-- Configurações do sistema
INSERT INTO system_configurations (
  config_key, config_value, config_type, description, is_sensitive
) VALUES 
  ('app_name', '"KIXIKILA"', 'general', 'Nome da aplicação', false),
  ('maintenance_mode', 'false', 'general', 'Modo de manutenção', false),
  ('max_groups_free', '2', 'limits', 'Máximo de grupos para usuários gratuitos', false),
  ('max_groups_vip', '10', 'limits', 'Máximo de grupos para usuários VIP', false),
  ('minimum_contribution', '10.00', 'financial', 'Contribuição mínima por ciclo', false)
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  updated_at = now();