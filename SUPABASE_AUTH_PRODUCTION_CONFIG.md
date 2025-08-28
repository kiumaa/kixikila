# 🔐 KIXIKILA - Configuração de Segurança Auth Supabase

## ⚠️ CONFIGURAÇÕES MANUAIS OBRIGATÓRIAS NO DASHBOARD

Os problemas de segurança detectados pelo linter requerem configuração **MANUAL** no Dashboard do Supabase. Estas configurações não podem ser aplicadas via SQL.

---

## 🚨 PROBLEMA 1: Auth OTP Long Expiry

### ❌ **Problema:**
- OTP com tempo de expiração muito longo (atualmente pode estar em 24 horas)
- Representa risco de segurança significativo

### ✅ **SOLUÇÃO OBRIGATÓRIA:**

1. **Acesse o Dashboard Supabase:**
   - URL: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt

2. **Navegue para Authentication:**
   - Clique em **Authentication** no menu lateral
   - Vá para **Settings**

3. **Configure OTP Expiry:**
   - Encontre a seção **"Auth configuration"**
   - Procure por **"OTP expiry"** ou **"Auth session timeout"**
   - **Defina para: 600 segundos (10 minutos)**

4. **Salve as alterações:**
   - Clique em **"Update"** ou **"Save"**

---

## 🚨 PROBLEMA 2: Leaked Password Protection Disabled

### ❌ **Problema:**
- Proteção contra senhas vazadas está desabilitada
- Usuários podem usar senhas comprometidas

### ✅ **SOLUÇÃO OBRIGATÓRIA:**

1. **Acesse Authentication > Settings:**
   - URL: https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings

2. **Configure Password Protection:**
   - Encontre a seção **"Password Protection"**
   - **ATIVE** a opção **"Enable password breach protection"**
   - Esta opção verifica senhas contra bases de dados de senhas vazadas

3. **Configure Password Strength (Recomendado):**
   - Defina **minimum length: 8 caracteres**
   - Ative **"Require uppercase letters"**
   - Ative **"Require lowercase letters"**  
   - Ative **"Require numbers"**
   - Ative **"Require special characters"**

4. **Salve as alterações:**
   - Clique em **"Update"** ou **"Save"**

---

## 🔍 OUTRAS CONFIGURAÇÕES DE SEGURANÇA IMPORTANTES

### 1. **Site URL Configuration**
```
Site URL: https://kixikila.pro
```

### 2. **Redirect URLs**
```
Allowed Redirect URLs:
- https://kixikila.pro/auth/callback
- https://www.kixikila.pro/auth/callback
- https://kixikila.pro/**
```

### 3. **Rate Limiting (Recomendado)**
- **SMS Rate Limit:** 10 por hora por IP
- **Email Rate Limit:** 30 por hora por IP

### 4. **Session Configuration**
- **Session timeout:** 24 horas (pode manter)
- **Refresh token rotation:** Habilitado

---

## ✅ VERIFICAÇÃO APÓS CONFIGURAÇÃO

1. **Execute o Security Linter novamente:**
   ```bash
   # No terminal do projeto
   npx supabase db linter
   ```

2. **Teste o OTP:**
   - Faça um teste de registro/login
   - Verifique se o OTP expira em 10 minutos

3. **Teste Password Protection:**
   - Tente registrar com senha comum (ex: "123456")
   - Deve ser rejeitada pelo sistema

---

## 🚨 CRITICAL: Não prosseguir sem corrigir!

**Estas configurações são OBRIGATÓRIAS para produção:**

- [ ] ✅ OTP configurado para 10 minutos
- [ ] ✅ Password breach protection ativado
- [ ] ✅ Site URLs configurados
- [ ] ✅ Rate limiting configurado
- [ ] ✅ Linter sem avisos de segurança

---

## 📞 Links Diretos (Substitua PROJECT_ID)

- **Auth Settings:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings
- **URL Configuration:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/url-configuration
- **Rate Limits:** https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/rate-limits

---

## ⏱️ TEMPO ESTIMADO: 5-10 minutos

Após completar todas as configurações, execute novamente:
```bash
node scripts/setup-domain.js
```

**Status:** 🔴 **BLOQUEADOR** - Deploy não pode prosseguir sem essas correções!