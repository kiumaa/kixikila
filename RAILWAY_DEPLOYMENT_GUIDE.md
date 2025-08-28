# 🚂 KIXIKILA - Guia de Deploy no Railway

## Pré-requisitos

- [ ] Conta no Railway (https://railway.app)
- [ ] Repositório no GitHub
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Build do backend funcionando localmente

## 🚀 Passo-a-Passo para Deploy

### 1. Criar Projeto no Railway

1. Acesse https://railway.app
2. Faça login com GitHub
3. Clique em **"New Project"**
4. Selecione **"Deploy from GitHub repo"**
5. Escolha o repositório do KIXIKILA
6. Selecione **"Deploy Now"**

### 2. Configurar Build Settings

1. No dashboard do Railway, vá em **Settings**
2. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm ci --only=production && npm run build`
   - **Start Command**: `npm run start:prod`

### 3. Configurar Environment Variables

Vá em **Variables** e adicione todas estas variáveis:

#### 🔐 Security & Authentication
```
JWT_SECRET=your-super-secure-jwt-secret-key-here-min-64-characters
ADMIN_PASSWORD=your-secure-admin-password-here
SESSION_SECRET=your-super-secure-session-secret-key-here
```

#### 🗄️ Supabase
```
SUPABASE_URL=https://hkesrohuaurcyonpktyt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZXNyb2h1YXVyY3lvbnBrdHl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMjIzMjksImV4cCI6MjA3MTg5ODMyOX0.SNDuFuzRerlL4qmlKGWFm8cf4UH21MmsbhxV4B8SVcg
SUPABASE_SERVICE_ROLE_KEY=[SUA-SERVICE-ROLE-KEY]
```

#### 💳 Stripe (LIVE KEYS!)
```
STRIPE_SECRET_KEY=sk_live_[SUA-CHAVE-LIVE]
STRIPE_PUBLISHABLE_KEY=pk_live_[SUA-CHAVE-LIVE]
STRIPE_WEBHOOK_SECRET=whsec_[SEU-WEBHOOK-SECRET]
```

#### 📱 BulkSMS
```
BULKSMS_USERNAME=[SEU-USERNAME]
BULKSMS_PASSWORD=[SUA-PASSWORD]
```

#### 📧 Email
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=noreply@kixikila.pro
EMAIL_PASS=[SUA-SENHA-APP]
EMAIL_FROM_ADDRESS=noreply@kixikila.pro
```

#### 🚀 Application
```
NODE_ENV=production
FRONTEND_URL=https://kixikila.pro
CORS_ORIGINS=https://kixikila.pro,https://www.kixikila.pro
```

### 4. Configurar Domínio Personalizado

1. No Railway, vá em **Settings > Domains**
2. Clique em **"Custom Domain"**
3. Adicione: `api.kixikila.pro`
4. Copie o CNAME target fornecido pelo Railway
5. Configure o DNS (próximo passo)

## 🌐 Configuração de DNS

Configure estes registros no seu provedor de domínio:

```
Tipo    Nome    Valor                           TTL
A       @       185.158.133.1                  300
A       www     185.158.133.1                  300
CNAME   api     [railway-domain].railway.app    300
TXT     @       v=spf1 include:_spf.google.com ~all
```

**Exemplo no Cloudflare/Namecheap:**
- `A @` → `185.158.133.1`
- `A www` → `185.158.133.1` 
- `CNAME api` → `kixikila-backend-production-xxxx.railway.app`

## ✅ Verificação do Deploy

### 1. Teste os Endpoints

```bash
# Health Check
curl https://api.kixikila.pro/api/v1/health

# Deve retornar status 200 com:
{
  "status": "healthy",
  "timestamp": "...",
  "services": {...}
}
```

### 2. Teste Funcionalidades

- [ ] Registro de usuário via SMS
- [ ] Login via email/senha
- [ ] Criação de grupos
- [ ] Pagamentos Stripe
- [ ] Notificações SMS

### 3. Monitor Logs

No Railway dashboard:
1. Vá em **Deployments**
2. Clique no deploy atual
3. Monitore os **Logs** em tempo real

## 🔧 Scripts de Automação

Execute os scripts fornecidos:

```bash
# Deploy automatizado
node scripts/deploy-production.js

# Verificar domínio
node scripts/setup-domain.js
```

## 🚨 Troubleshooting

### Build Errors
- Verifique se todas as dependências estão no `package.json`
- Confirme que o TypeScript build está funcionando
- Verifique logs de build no Railway

### DNS Issues
- Use https://dnschecker.org para verificar propagação
- Aguarde até 48h para propagação completa
- Verifique se não há registros conflitantes

### SSL Issues
- Railway configura SSL automaticamente
- Verifique se o domínio está corretamente configurado
- Aguarde alguns minutos após configuração DNS

### Health Check Failures
- Verifique se o endpoint `/api/v1/health` existe
- Confirme que o servidor está rodando na PORT correta
- Verifique variáveis de ambiente

## 📞 Suporte

- **Railway**: https://docs.railway.app/
- **Supabase**: https://supabase.com/dashboard/support
- **Stripe**: https://dashboard.stripe.com/support

## 🎉 Pós-Deploy

Após deploy bem-sucedido:

1. [ ] Teste todos os fluxos críticos
2. [ ] Configure monitoramento
3. [ ] Configure backups
4. [ ] Documente URLs de produção
5. [ ] Notifique a equipe

**URLs de Produção:**
- Frontend: https://kixikila.pro
- API: https://api.kixikila.pro
- Admin: https://kixikila.pro/admin
- Health: https://api.kixikila.pro/api/v1/health