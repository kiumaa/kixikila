# 🚂 Deploy Railway - Guia Rápido

## 🚀 Execução Automática

```bash
# Executar script de deploy
node scripts/deploy-railway.js

# Ou verificar apenas pré-requisitos
node scripts/deploy-railway.js check
```

## 📋 Checklist de Deploy

### 1. Railway Setup
- [ ] Conta no Railway criada
- [ ] Railway CLI instalado: `npm install -g @railway/cli`
- [ ] Autenticado: `railway login`

### 2. Projeto Railway
- [ ] New Project → Deploy from GitHub repo
- [ ] Repositório KIXIKILA selecionado
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm ci --only=production && npm run build`
- [ ] Start Command: `npm run start:prod`

### 3. Environment Variables

**⚠️ CRÍTICO: Configure no Railway Dashboard → Variables**

```bash
# Security
JWT_SECRET=sua-chave-jwt-super-segura-64-caracteres
ADMIN_PASSWORD=sua-senha-admin-segura
SESSION_SECRET=sua-chave-session-super-segura-64-caracteres

# Supabase
SUPABASE_URL=https://hkesrohuaurcyonpktyt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Stripe (LIVE KEYS!)
STRIPE_SECRET_KEY=sk_live_sua-chave-live
STRIPE_PUBLISHABLE_KEY=pk_live_sua-chave-live
STRIPE_WEBHOOK_SECRET=whsec_seu-webhook-secret

# BulkSMS
BULKSMS_USERNAME=seu-username
BULKSMS_PASSWORD=sua-password

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@kixikila.pro
EMAIL_PASS=sua-senha-app

# Application
NODE_ENV=production
FRONTEND_URL=https://kixikila.pro
CORS_ORIGINS=https://kixikila.pro,https://www.kixikila.pro
```

### 4. Domínio Personalizado
- [ ] Railway → Settings → Domains
- [ ] Adicionar: `api.kixikila.pro`
- [ ] Copiar CNAME target do Railway

### 5. DNS Configuration

Configure no seu provedor de domínio:

```
Tipo    Nome    Valor
----    ----    -----
A       @       185.158.133.1
A       www     185.158.133.1  
CNAME   api     [railway-domain].railway.app
TXT     @       v=spf1 include:_spf.google.com ~all
```

**Exemplo Cloudflare/Namecheap:**
- `A @ → 185.158.133.1`
- `A www → 185.158.133.1`
- `CNAME api → kixikila-backend-production-xxxx.railway.app`

### 6. Verificação

**Health Check:**
```bash
curl https://api.kixikila.pro/api/v1/health
```

**Resposta Esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-29T...",
  "services": { ... }
}
```

## 🔧 Troubleshooting

### Build Errors
- Verificar `package.json` scripts
- Confirmar dependências instaladas
- Verificar logs no Railway Dashboard

### DNS Issues
- Usar https://dnschecker.org
- Aguardar até 48h para propagação
- Verificar registros conflitantes

### SSL Issues
- Railway configura SSL automaticamente
- Aguardar alguns minutos após DNS
- Verificar domínio no Railway Dashboard

### Health Check Failures
- Verificar variáveis de ambiente
- Confirmar PORT configuração
- Verificar logs no Railway

## 📞 Links Úteis

- **Railway Dashboard**: https://railway.app/dashboard
- **DNS Checker**: https://dnschecker.org
- **Railway Docs**: https://docs.railway.app

## ✅ Pós-Deploy

Após deploy bem-sucedido:

1. [ ] Testar health check: `https://api.kixikila.pro/api/v1/health`
2. [ ] Verificar logs no Railway Dashboard
3. [ ] Testar integração com frontend
4. [ ] Configurar monitoramento
5. [ ] Documentar URLs de produção

**URLs Finais:**
- Frontend: https://kixikila.pro
- API: https://api.kixikila.pro
- Health: https://api.kixikila.pro/api/v1/health