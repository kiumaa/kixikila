# KIXIKILA - Configuração do Supabase para Produção

Este guia irá ajudá-lo a configurar o Supabase para produção da aplicação KIXIKILA.

## 📋 Pré-requisitos

- [ ] Conta no [Supabase](https://supabase.com)
- [ ] Projeto Supabase criado
- [ ] Acesso ao SQL Editor do Supabase

## 🗄️ Configuração do Banco de Dados

### 1. Executar Schema SQL

1. **Acesse o Supabase Dashboard**
   - Vá para [supabase.com](https://supabase.com)
   - Faça login na sua conta
   - Selecione seu projeto

2. **Abrir SQL Editor**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New Query**

3. **Executar Schema**
   - Copie todo o conteúdo do arquivo `backend/database/schema.sql`
   - Cole no SQL Editor
   - Clique em **Run** para executar

### 2. Configurar Row Level Security (RLS)

O schema já inclui as políticas de RLS, mas verifique se estão ativas:

```sql
-- Verificar se RLS está ativo nas tabelas principais
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'groups', 'group_members', 'transactions', 'notifications');
```

### 3. Configurar Autenticação

1. **Configurar Providers**
   - Vá para **Authentication > Settings**
   - Em **Auth Providers**, configure:
     - ✅ Email (habilitado)
     - ✅ Phone (habilitado para OTP)

2. **Configurar Email Templates**
   - Vá para **Authentication > Email Templates**
   - Personalize os templates conforme necessário

3. **Configurar Phone Auth**
   - Vá para **Authentication > Settings**
   - Em **Phone Auth**, configure:
     - ✅ Enable phone confirmations
     - ✅ Enable phone change confirmations

### 4. Configurar Webhooks (Opcional)

Para sincronização com o backend:

1. **Criar Webhook**
   - Vá para **Database > Webhooks**
   - Clique em **Create a new hook**
   - Configure:
     - **Name:** `user_changes`
     - **Table:** `users`
     - **Events:** `INSERT`, `UPDATE`
     - **URL:** `https://sua-api-url.com/api/v1/webhooks/supabase`

## 🔐 Configuração de Segurança

### 1. Configurar Políticas de Senha

```sql
-- Configurar política de senha forte
UPDATE auth.config 
SET password_min_length = 8;
```

### 2. Configurar Rate Limiting

1. **Vá para Settings > API**
2. Configure:
   - **Rate limiting:** Habilitado
   - **Requests per minute:** 100 (ajuste conforme necessário)

### 3. Configurar CORS

1. **Vá para Settings > API**
2. Em **CORS origins**, adicione:
   ```
   https://kixikila.vercel.app
   https://www.kixikila.com
   ```

## 📊 Configuração de Dados Iniciais

### 1. Inserir Configurações do Sistema

```sql
-- Inserir configurações padrão
INSERT INTO system_config (key, value, description, is_public) VALUES
    ('app_name', '"KIXIKILA"', 'Nome da aplicação', true),
    ('app_version', '"1.0.0"', 'Versão da aplicação', true),
    ('maintenance_mode', 'false', 'Modo de manutenção', false),
    ('max_group_members', '50', 'Número máximo de membros por grupo', true),
    ('min_contribution', '1000', 'Contribuição mínima em AOA', true),
    ('transaction_fee_percentage', '0.5', 'Taxa de transação em percentagem', true),
    ('otp_expiry_minutes', '10', 'Tempo de expiração do OTP em minutos', false),
    ('max_login_attempts', '5', 'Número máximo de tentativas de login', false)
ON CONFLICT (key) DO NOTHING;
```

### 2. Criar Usuário Administrador

```sql
-- Criar usuário admin (execute após configurar autenticação)
INSERT INTO users (
    id,
    email,
    full_name,
    role,
    status,
    email_verified,
    created_at
) VALUES (
    uuid_generate_v4(),
    'admin@kixikila.com',
    'KIXIKILA Admin',
    'admin',
    'active',
    true,
    NOW()
) ON CONFLICT (email) DO NOTHING;
```

## 🔧 Configuração de Performance

### 1. Criar Índices Adicionais (se necessário)

```sql
-- Índices para melhor performance (já incluídos no schema)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
```

### 2. Configurar Connection Pooling

1. **Vá para Settings > Database**
2. Configure:
   - **Connection pooling:** Habilitado
   - **Pool size:** 15-20 (para produção)
   - **Pool mode:** Transaction

## 📈 Monitoramento

### 1. Configurar Logs

1. **Vá para Logs**
2. Configure alertas para:
   - Erros de autenticação
   - Queries lentas
   - Uso excessivo de recursos

### 2. Configurar Métricas

1. **Vá para Reports**
2. Monitore:
   - Número de usuários ativos
   - Queries por segundo
   - Uso de storage

## 🔄 Backup e Recuperação

### 1. Configurar Backups Automáticos

1. **Vá para Settings > Database**
2. Configure:
   - **Point-in-time recovery:** Habilitado
   - **Backup retention:** 7 dias (mínimo)

### 2. Testar Recuperação

```sql
-- Criar backup manual para teste
-- (Use a interface do Supabase para criar backups)
```

## ✅ Checklist de Verificação

- [ ] Schema SQL executado com sucesso
- [ ] RLS configurado e ativo
- [ ] Autenticação por email configurada
- [ ] Autenticação por telefone configurada
- [ ] Políticas de segurança aplicadas
- [ ] CORS configurado
- [ ] Dados iniciais inseridos
- [ ] Usuário admin criado
- [ ] Índices criados
- [ ] Connection pooling configurado
- [ ] Backups configurados
- [ ] Monitoramento ativo

## 🚨 Troubleshooting

### Erro: "relation does not exist"
- Verifique se o schema foi executado completamente
- Execute novamente as partes que falharam

### Erro: "RLS policy violation"
- Verifique se as políticas RLS estão corretas
- Teste com usuário autenticado

### Performance lenta
- Verifique se os índices foram criados
- Analise queries no SQL Editor
- Configure connection pooling

## 📞 Suporte

Para problemas específicos:
1. Verifique os logs do Supabase
2. Consulte a [documentação oficial](https://supabase.com/docs)
3. Entre em contato com o suporte do Supabase se necessário

---

**Nota:** Mantenha suas chaves de API seguras e nunca as compartilhe publicamente.