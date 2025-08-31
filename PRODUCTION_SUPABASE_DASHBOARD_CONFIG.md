# 🚀 KIXIKILA - Configuração Supabase Dashboard PRODUÇÃO

## ⚠️ CONFIGURAÇÕES OBRIGATÓRIAS - Fazer AGORA!

**Project ID:** `hkesrohuaurcyonpktyt`
**Dashboard:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt

---

## 🔒 1. CONFIGURAÇÃO DE AUTENTICAÇÃO

### A. Auth Settings - OTP Configuration
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings

1. **OTP Expiry (CRÍTICO)**:
   - Procure por **"OTP expiry"** ou **"Auth configuration"**
   - **Definir para: 600 segundos (10 minutos)**
   - Salvar alterações

2. **Password Protection (CRÍTICO)**:
   - Encontre **"Password Protection"**
   - **✅ ATIVAR "Enable password breach protection"**
   - **Configurar força da senha:**
     - Minimum length: 8 caracteres
     - ✅ Require uppercase letters
     - ✅ Require lowercase letters
     - ✅ Require numbers
     - ✅ Require special characters

### B. URL Configuration
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/url-configuration

1. **Site URL:**
   ```
   https://kixikila.pro
   ```

2. **Redirect URLs (Adicionar todos):**
   ```
   https://kixikila.pro/auth/callback
   https://www.kixikila.pro/auth/callback
   https://kixikila.pro/**
   https://hkesrohuaurcyonpktyt-production.up.railway.app/**
   ```

### C. Rate Limiting
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/rate-limits

1. **Definir Limites:**
   - **SMS Rate Limit:** 10 por hora por IP
   - **Email Rate Limit:** 30 por hora por IP
   - **Sign Up Rate Limit:** 20 por hora por IP
   - **Sign In Rate Limit:** 30 por hora por IP
   - **Password Reset:** 10 por hora por IP

---

## 📧 2. CONFIGURAÇÃO DE EMAIL

### A. SMTP Settings
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/templates

1. **Configurar SMTP:**
   - Host: `smtp.gmail.com` (ou seu provedor)
   - Port: `587`
   - Username: `seu-email@kixikila.pro`
   - Password: `app-password-gerado`

2. **Templates de Email:**
   - **Welcome Email:** Personalizar com marca KIXIKILA
   - **Password Reset:** Incluir logo e instruções claras
   - **Email Verification:** Template profissional

---

## 🔧 3. CONFIGURAÇÕES AVANÇADAS

### A. Database Settings
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/database

1. **Connection Pooling:**
   - ✅ Enable Connection Pooling
   - Mode: Transaction
   - Pool Size: 15

2. **Backup Configuration:**
   - ✅ Enable automated backups
   - Retention: 7 days
   - Schedule: Daily at 2 AM UTC

### B. API Settings
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/api

1. **CORS Configuration:**
   ```json
   {
     "origins": [
       "https://kixikila.pro",
       "https://www.kixikila.pro",
       "https://hkesrohuaurcyonpktyt-production.up.railway.app"
     ],
     "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
     "headers": ["authorization", "content-type", "x-client-info"]
   }
   ```

### C. Edge Functions Settings
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/functions

1. **Verificar Edge Functions Ativas:**
   - ✅ send-otp-sms
   - ✅ verify-otp
   - ✅ create-payment
   - ✅ send-email
   - ✅ security-monitoring
   - ✅ production-health

---

## 🎯 4. WEBHOOK CONFIGURATION (Opcional)

### A. Database Webhooks
**URL:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/database/webhooks

1. **User Registration Webhook:**
   - Table: `auth.users`
   - Events: `INSERT`
   - HTTP Request: `POST https://api.kixikila.pro/webhooks/user-created`

---

## ✅ 5. CHECKLIST DE VERIFICAÇÃO

### Executar após todas as configurações:

1. **✅ Teste de Autenticação:**
   ```bash
   # Registar novo usuário
   # Verificar se OTP expira em 10 minutos
   # Tentar senha fraca (deve ser rejeitada)
   ```

2. **✅ Teste de URLs:**
   ```bash
   # Login deve redirecionar para kixikila.pro
   # Email verification deve funcionar
   ```

3. **✅ Verificar Rate Limits:**
   ```bash
   # Tentar múltiplos logins (deve bloquear após limite)
   # Testar SMS rate limiting
   ```

4. **✅ Executar Linter:**
   ```bash
   npx supabase db linter
   # Deve retornar SEM warnings de segurança
   ```

---

## 🚨 CONFIGURAÇÃO CONCLUÍDA

**Tempo Estimado:** 15-20 minutos
**Status:** 🔴 **BLOQUEADOR** - Deploy não pode prosseguir sem estas configurações!

**Próximo Passo:** Executar testes de produção
```bash
npm run test:security
npm run test:functionality
```

---

## 📞 LINKS DIRETOS

- **Auth Settings:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings
- **URL Configuration:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/url-configuration
- **Rate Limits:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/rate-limits
- **Email Templates:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/templates
- **Database Settings:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/database

**⏱️ Após configurar tudo:** Executar `node scripts/validate-production-config.js`