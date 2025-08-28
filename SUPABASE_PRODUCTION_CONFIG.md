# 🔧 KIXIKILA - Configurações Manuais do Supabase para Produção

## ⚠️ CONFIGURAÇÕES CRÍTICAS QUE DEVEM SER FEITAS MANUALMENTE

Estas configurações **NÃO PODEM** ser feitas via SQL e devem ser configuradas no dashboard do Supabase antes do go-live.

## 🔐 1. Configurar Auth OTP Expiry (CRÍTICO)

**Status atual**: ❌ OTP está com expiração muito longa

### Como configurar:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/providers
2. Clique em **"Phone Auth"**
3. Configure **"OTP Expiry"** para **600 segundos (10 minutos)**
4. Salve as alterações

### Verificação:
- ✅ OTP expira em 10 minutos
- ✅ Usuários não conseguem usar códigos antigos

## 🛡️ 2. Ativar Leaked Password Protection (CRÍTICO)

**Status atual**: ❌ Proteção desabilitada

### Como configurar:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/providers
2. Vá para seção **"Password Protection"**
3. Ative **"Enable password breach protection"**
4. Salve as alterações

### Verificação:
- ✅ Senhas vazadas são rejeitadas
- ✅ Usuários são forçados a usar senhas seguras

## 🌐 3. Configurar URLs de Redirecionamento

### Como configurar:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/url-configuration
2. Configure:
   - **Site URL**: `https://kixikila.pro`
   - **Redirect URLs**: 
     - `https://kixikila.pro/auth/callback`
     - `https://www.kixikila.pro/auth/callback`
     - `https://kixikila.pro/**` (para wildcards)

### Verificação:
- ✅ Login/signup redireciona corretamente
- ✅ Não há erros de CORS

## 📧 4. Configurar SMTP para Emails

### Como configurar:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/providers
2. Vá para **"SMTP Settings"**
3. Configure:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: `noreply@kixikila.pro`
   - **Password**: `[SUA-SENHA-APP]`
   - **Sender Name**: `KIXIKILA`
   - **Sender Email**: `noreply@kixikila.pro`

### Verificação:
- ✅ Emails de confirmação são enviados
- ✅ Reset de senha funciona

## 🔒 5. Configurações de Segurança Avançadas

### Rate Limiting:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/rate-limits
2. Configure:
   - **Sign-up**: 10 tentativas por hora por IP
   - **Sign-in**: 20 tentativas por hora por IP
   - **Password Reset**: 5 tentativas por hora por email

### Session Management:
1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/providers
2. Configure:
   - **Session Timeout**: 86400 segundos (24 horas)
   - **Refresh Token Rotation**: Ativado
   - **Reuse Interval**: 10 segundos

## 📱 6. Configurar Webhook do Supabase (Opcional)

Para monitoramento avançado:

1. Acesse: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/database/webhooks
2. Crie webhook para:
   - **URL**: `https://api.kixikila.pro/api/v1/webhooks/supabase`
   - **Events**: `INSERT`, `UPDATE`, `DELETE` na tabela `users`
   - **Headers**: `Authorization: Bearer [SEU-WEBHOOK-SECRET]`

## 🎯 7. Verificação Final

Execute este checklist após todas as configurações:

### Teste de Autenticação:
- [ ] Registro com email funciona
- [ ] Login com email/senha funciona  
- [ ] OTP por SMS funciona (se configurado)
- [ ] Reset de senha via email funciona
- [ ] Logout funciona corretamente

### Teste de Segurança:
- [ ] Senhas fracas são rejeitadas
- [ ] OTPs expiram em 10 minutos
- [ ] Rate limiting está ativo
- [ ] Redirects funcionam corretamente

### Teste de Performance:
- [ ] Login é rápido (< 2 segundos)
- [ ] Queries são otimizadas
- [ ] Índices estão funcionando

## 📊 8. Monitoramento Contínuo

### Dashboard do Supabase:
- Monitor de uso: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/reports/usage
- Logs de Auth: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/users
- Logs de API: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/logs/explorer

### Edge Functions:
- Health Check: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/functions/health-check/logs
- Admin Monitoring: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/functions/admin-monitoring/logs

## 🚨 Alertas Importantes

⚠️ **NUNCA** exponha chaves de service role no frontend
⚠️ **SEMPRE** use HTTPS em produção
⚠️ **CONFIGURE** backups automáticos
⚠️ **MONITORE** logs regularmente
⚠️ **TESTE** todas as funcionalidades antes do go-live

## 📞 Suporte

Se encontrar problemas:

1. **Supabase Support**: https://supabase.com/dashboard/support
2. **Documentação**: https://supabase.com/docs
3. **Community**: https://github.com/supabase/supabase/discussions

---

**✅ Após completar todas estas configurações, execute o security linter novamente para confirmar que não há mais warnings de segurança.**