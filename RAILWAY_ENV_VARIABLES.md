# 🔐 Railway Environment Variables

## ⚠️ IMPORTANTE: Configure no Railway Dashboard

Vá em **Railway Dashboard → Seu Projeto → Variables** e adicione:

### 🔐 Security & Authentication
```
JWT_SECRET=[GERAR NOVA CHAVE SEGURA 64+ CARACTERES]
ADMIN_PASSWORD=[SUA SENHA ADMIN SEGURA]
SESSION_SECRET=[GERAR NOVA CHAVE SEGURA 64+ CARACTERES]
```

### 🗄️ Supabase (Já configurado)
```
SUPABASE_URL=https://hkesrohuaurcyonpktyt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZXNyb2h1YXVyY3lvbnBrdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjIzMjksImV4cCI6MjA3MVM4OTgzMjl9.SNDuFuzRerlL4qmlKGWFm8cf4UH21MmsbhxV4B8SVcg
SUPABASE_SERVICE_ROLE_KEY=[PEGAR DO SUPABASE SECRETS]
```

### 💳 Stripe (LIVE KEYS!)
```
STRIPE_SECRET_KEY=[PEGAR DO SUPABASE SECRETS]
STRIPE_PUBLISHABLE_KEY=pk_live_[SUA CHAVE LIVE]
STRIPE_WEBHOOK_SECRET=whsec_[SEU WEBHOOK SECRET]
```

### 📱 BulkSMS
```
BULKSMS_USERNAME=[PEGAR DO SUPABASE SECRETS]
BULKSMS_PASSWORD=[PEGAR DO SUPABASE SECRETS]
```

### 📧 Email
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@kixikila.pro
EMAIL_PASS=[SUA SENHA APP GMAIL]
EMAIL_FROM_ADDRESS=noreply@kixikila.pro
```

### 🚀 Application
```
NODE_ENV=production
FRONTEND_URL=https://kixikila.pro
CORS_ORIGINS=https://kixikila.pro,https://www.kixikila.pro
API_VERSION=v1
```

### 📊 Performance & Security
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
OTP_EXPIRY_MINUTES=10
OTP_MAX_ATTEMPTS=3
```

## 🔍 Como Obter os Secrets do Supabase

Vá para **Supabase Dashboard → Settings → Edge Functions** e copie:

- `SUPABASE_SERVICE_ROLE_KEY` 
- `STRIPE_SECRET_KEY`
- `BULKSMS_USERNAME`
- `BULKSMS_PASSWORD`

## ⚡ Quick Copy & Paste

Para facilitar, use estes comandos no Railway CLI:

```bash
# Autenticar
railway login

# Selecionar projeto
railway link

# Configurar variáveis essenciais
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://kixikila.pro
railway variables set CORS_ORIGINS=https://kixikila.pro,https://www.kixikila.pro
railway variables set API_VERSION=v1
railway variables set EMAIL_HOST=smtp.gmail.com
railway variables set EMAIL_PORT=587
railway variables set RATE_LIMIT_WINDOW_MS=900000
railway variables set RATE_LIMIT_MAX_REQUESTS=100
railway variables set LOG_LEVEL=info
railway variables set OTP_EXPIRY_MINUTES=10
railway variables set OTP_MAX_ATTEMPTS=3

# CRITICAL: Configure manualmente no Dashboard
# JWT_SECRET, ADMIN_PASSWORD, SESSION_SECRET
# SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY
# BULKSMS_USERNAME, BULKSMS_PASSWORD
# EMAIL_USER, EMAIL_PASS
```

## 🚨 Importante

1. **NUNCA** commite secrets no código
2. Use **LIVE KEYS** do Stripe para produção
3. Gere **JWT_SECRET** com 64+ caracteres
4. Use senha **forte** para ADMIN_PASSWORD
5. Configure **CORS_ORIGINS** corretamente