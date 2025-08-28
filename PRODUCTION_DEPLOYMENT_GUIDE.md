# KIXIKILA - Guia de Deploy para Produção

Este guia completo irá ajudá-lo a fazer o deploy da aplicação KIXIKILA em produção.

## 📋 Pré-requisitos

- [ ] Configurações de ambiente de produção completas
- [ ] Supabase configurado
- [ ] Stripe configurado
- [ ] BulkSMS configurado
- [ ] Conta no Railway (backend)
- [ ] Conta no Vercel (frontend)
- [ ] Repositório Git atualizado

## 🚀 Deploy do Backend (Railway)

### 1. Preparação do Projeto

1. **Verificar Estrutura do Projeto**
   ```bash
   # Navegar para o diretório do backend
   cd backend
   
   # Verificar se package.json tem scripts necessários
   npm run build  # Deve funcionar
   npm start      # Deve funcionar
   ```

2. **Verificar Arquivo .env.production**
   ```bash
   # Verificar se todas as variáveis estão configuradas
   cat .env.production
   ```

### 2. Deploy no Railway

1. **Criar Conta no Railway**
   - Vá para [railway.app](https://railway.app)
   - Faça login com GitHub
   - Conecte seu repositório

2. **Criar Novo Projeto**
   - Clique em **New Project**
   - Selecione **Deploy from GitHub repo**
   - Escolha o repositório KIXIKILA
   - Selecione a pasta `backend`

3. **Configurar Variáveis de Ambiente**
   
   No Railway Dashboard, vá para **Variables** e adicione:
   
   ```env
   # Server Configuration
   NODE_ENV=production
   PORT=3000
   API_VERSION=v1
   
   # CORS Configuration
   CORS_ORIGIN=https://kixikila.vercel.app,https://www.kixikila.com
   CORS_CREDENTIALS=true
   
   # JWT Configuration
   JWT_SECRET=seu_jwt_secret_super_seguro_aqui_min_32_chars
   JWT_EXPIRES_IN=7d
   
   # Supabase Configuration
   SUPABASE_URL=https://seu-projeto.supabase.co
   SUPABASE_ANON_KEY=sua_chave_anonima_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_supabase
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=sk_live_sua_chave_secreta_stripe
   STRIPE_PUBLIC_KEY=pk_live_sua_chave_publica_stripe
   STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret_stripe
   
   # BulkSMS Configuration
   BULKSMS_TOKEN_ID=seu_token_id_bulksms
   BULKSMS_TOKEN_SECRET=seu_token_secret_bulksms
   BULKSMS_FROM=KIXIKILA
   
   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true
   
   # Logging
   LOG_LEVEL=info
   LOG_FILE_ENABLED=true
   LOG_MAX_SIZE=10485760
   LOG_MAX_FILES=5
   
   # Security
   BCRYPT_ROUNDS=12
   OTP_EXPIRY_MINUTES=10
   OTP_MAX_ATTEMPTS=3
   SESSION_SECRET=sua_session_secret_super_segura_aqui
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=seu_email@gmail.com
   EMAIL_PASSWORD=sua_senha_de_aplicativo
   EMAIL_FROM_NAME=KIXIKILA
   EMAIL_FROM_ADDRESS=noreply@kixikila.com
   
   # Database Configuration
   DB_POOL_MIN=2
   DB_POOL_MAX=10
   DB_TIMEOUT=30000
   DB_SSL=true
   
   # Admin Configuration
   ADMIN_EMAIL=admin@kixikila.com
   ADMIN_PASSWORD=sua_senha_admin_super_segura
   ADMIN_NAME=KIXIKILA Admin
   
   # File Upload Configuration
   MAX_FILE_SIZE=5242880
   ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
   UPLOAD_DEST=uploads
   
   # Notification Configuration
   NOTIFICATION_BATCH_SIZE=100
   NOTIFICATION_RETRY_ATTEMPTS=3
   NOTIFICATION_RETRY_DELAY=5000
   
   # Scheduled Tasks Configuration
   SCHEDULED_TASKS_ENABLED=true
   CRON_CLEANUP_LOGS=0 2 * * *
   CRON_PROCESS_NOTIFICATIONS=*/5 * * * *
   CRON_BACKUP_DATA=0 3 * * 0
   
   # Webhook Configuration
   WEBHOOK_SECRET=sua_webhook_secret_super_segura_aqui
   ```

4. **Configurar Build e Deploy**
   
   Railway detectará automaticamente o Node.js, mas você pode criar um `railway.toml`:
   
   ```toml
   [build]
   builder = "NIXPACKS"
   
   [deploy]
   startCommand = "npm start"
   restartPolicyType = "ON_FAILURE"
   restartPolicyMaxRetries = 10
   ```

5. **Deploy**
   - Railway fará o deploy automaticamente
   - Aguarde o build completar
   - Anote a URL gerada (ex: `https://kixikila-backend-production.up.railway.app`)

### 3. Configurar Domínio Personalizado (Opcional)

1. **No Railway Dashboard**
   - Vá para **Settings > Domains**
   - Clique em **Custom Domain**
   - Adicione: `api.kixikila.com`
   - Configure DNS no seu provedor

2. **Configurar DNS**
   ```
   Type: CNAME
   Name: api
   Value: kixikila-backend-production.up.railway.app
   TTL: 300
   ```

## 🌐 Deploy do Frontend (Vercel)

### 1. Preparação do Frontend

1. **Atualizar Configuração da API**
   
   Edite `src/config/api.ts`:
   ```typescript
   const API_BASE_URLS = {
     development: 'http://localhost:3000/api/v1',
     production: 'https://kixikila-backend-production.up.railway.app/api/v1', // Sua URL do Railway
     staging: 'https://kixikila-backend-staging.up.railway.app/api/v1'
   };
   ```

2. **Verificar Build Local**
   ```bash
   # Navegar para o diretório raiz
   cd ..
   
   # Instalar dependências
   npm install
   
   # Testar build
   npm run build
   ```

### 2. Deploy no Vercel

1. **Criar Conta no Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com GitHub
   - Conecte seu repositório

2. **Importar Projeto**
   - Clique em **New Project**
   - Selecione o repositório KIXIKILA
   - **Framework Preset:** Vite
   - **Root Directory:** `.` (raiz do projeto)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

3. **Configurar Variáveis de Ambiente**
   
   No Vercel Dashboard, vá para **Settings > Environment Variables**:
   
   ```env
   # API Configuration
   VITE_API_BASE_URL=https://kixikila-backend-production.up.railway.app/api/v1
   
   # Supabase Configuration
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
   
   # Stripe Configuration
   VITE_STRIPE_PUBLIC_KEY=pk_live_sua_chave_publica_stripe
   
   # App Configuration
   VITE_APP_NAME=KIXIKILA
   VITE_APP_VERSION=1.0.0
   VITE_APP_ENVIRONMENT=production
   
   # Feature Flags
   VITE_ENABLE_ANALYTICS=true
   VITE_ENABLE_ERROR_REPORTING=true
   VITE_ENABLE_PERFORMANCE_MONITORING=true
   ```

4. **Deploy**
   - Clique em **Deploy**
   - Aguarde o build completar
   - Anote a URL gerada (ex: `https://kixikila.vercel.app`)

### 3. Configurar Domínio Personalizado

1. **No Vercel Dashboard**
   - Vá para **Settings > Domains**
   - Adicione: `kixikila.com` e `www.kixikila.com`

2. **Configurar DNS**
   ```
   # Para kixikila.com
   Type: A
   Name: @
   Value: 76.76.19.61
   
   # Para www.kixikila.com
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

## 🔧 Configurações Pós-Deploy

### 1. Atualizar URLs no Backend

1. **Atualizar CORS**
   ```env
   # No Railway, atualizar variável
   CORS_ORIGIN=https://kixikila.vercel.app,https://www.kixikila.com,https://kixikila.com
   ```

2. **Redeploy Backend**
   - No Railway, vá para **Deployments**
   - Clique em **Redeploy**

### 2. Configurar Webhooks

1. **Stripe Webhooks**
   - URL: `https://kixikila-backend-production.up.railway.app/api/v1/stripe/webhook`
   - Eventos: payment_intent.succeeded, payment_intent.payment_failed, etc.

2. **Supabase Webhooks** (opcional)
   - URL: `https://kixikila-backend-production.up.railway.app/api/v1/webhooks/supabase`

### 3. Configurar SSL/HTTPS

- **Railway:** SSL automático
- **Vercel:** SSL automático
- **Domínios personalizados:** Verificar certificados

## 📊 Monitoramento e Logs

### 1. Railway Monitoring

1. **Logs**
   - Vá para **Deployments > Logs**
   - Configure alertas para erros

2. **Métricas**
   - Monitor CPU, RAM, Network
   - Configure alertas de performance

3. **Health Checks**
   ```javascript
   // Adicionar endpoint de health check
   app.get('/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       environment: process.env.NODE_ENV
     });
   });
   ```

### 2. Vercel Analytics

1. **Ativar Analytics**
   - No Vercel Dashboard
   - Vá para **Analytics**
   - Ative Web Analytics

2. **Performance Monitoring**
   - Monitor Core Web Vitals
   - Configure alertas de performance

### 3. Error Tracking (Opcional)

1. **Sentry Setup**
   ```bash
   # Instalar Sentry
   npm install @sentry/node @sentry/react
   ```

2. **Configurar Backend**
   ```javascript
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

3. **Configurar Frontend**
   ```javascript
   import * as Sentry from '@sentry/react';
   
   Sentry.init({
     dsn: process.env.VITE_SENTRY_DSN,
     environment: process.env.VITE_APP_ENVIRONMENT
   });
   ```

## 🧪 Testes Pós-Deploy

### 1. Testes de Conectividade

```bash
# Testar backend
curl https://kixikila-backend-production.up.railway.app/health

# Testar frontend
curl https://kixikila.vercel.app

# Testar API
curl https://kixikila-backend-production.up.railway.app/api/v1/auth/health
```

### 2. Testes de Funcionalidades

1. **Registro de Usuário**
   - Criar nova conta
   - Verificar email de boas-vindas
   - Verificar SMS de boas-vindas

2. **Login**
   - Fazer login
   - Verificar JWT token
   - Testar refresh token

3. **Pagamentos**
   - Testar Stripe integration
   - Verificar webhooks
   - Testar diferentes cenários

4. **Notificações**
   - Testar envio de email
   - Testar envio de SMS
   - Verificar templates

### 3. Testes de Performance

```bash
# Usar Apache Bench para teste de carga
ab -n 100 -c 10 https://kixikila-backend-production.up.railway.app/api/v1/health

# Usar curl para testar latência
time curl https://kixikila-backend-production.up.railway.app/api/v1/health
```

## 🔄 CI/CD Setup (Opcional)

### 1. GitHub Actions

Crie `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      # Test Backend
      - name: Test Backend
        run: |
          cd backend
          npm install
          npm run test
      
      # Test Frontend
      - name: Test Frontend
        run: |
          npm install
          npm run test
  
  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Railway
        run: |
          # Railway auto-deploys on push to main
          echo "Backend deployed to Railway"
  
  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        run: |
          # Vercel auto-deploys on push to main
          echo "Frontend deployed to Vercel"
```

### 2. Automated Testing

```yaml
# Adicionar ao workflow
- name: E2E Tests
  run: |
    npm run test:e2e
    
- name: Security Scan
  run: |
    npm audit
    npm run security:scan
```

## 📋 Checklist Final

### Backend (Railway)
- [ ] Deploy realizado com sucesso
- [ ] Todas as variáveis de ambiente configuradas
- [ ] Health check respondendo
- [ ] Logs funcionando
- [ ] SSL ativo
- [ ] Domínio personalizado configurado (opcional)

### Frontend (Vercel)
- [ ] Deploy realizado com sucesso
- [ ] Variáveis de ambiente configuradas
- [ ] Build funcionando
- [ ] SSL ativo
- [ ] Domínio personalizado configurado

### Integrações
- [ ] Supabase conectado
- [ ] Stripe webhooks funcionando
- [ ] BulkSMS enviando mensagens
- [ ] Email funcionando
- [ ] CORS configurado corretamente

### Testes
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Pagamentos funcionando
- [ ] Notificações funcionando
- [ ] Performance aceitável

### Monitoramento
- [ ] Logs configurados
- [ ] Alertas configurados
- [ ] Métricas monitoradas
- [ ] Error tracking ativo (opcional)

## 🚨 Troubleshooting

### Problemas Comuns

1. **Build Failed**
   ```bash
   # Verificar logs de build
   # Verificar dependências
   # Verificar scripts package.json
   ```

2. **CORS Errors**
   ```bash
   # Verificar CORS_ORIGIN
   # Verificar URLs do frontend
   # Verificar protocolo (http vs https)
   ```

3. **Database Connection**
   ```bash
   # Verificar Supabase URLs
   # Verificar chaves de API
   # Verificar RLS policies
   ```

4. **Environment Variables**
   ```bash
   # Verificar se todas estão definidas
   # Verificar valores corretos
   # Verificar encoding/escaping
   ```

### Logs Úteis

```bash
# Railway logs
railway logs

# Vercel logs
vercel logs

# Local debugging
NODE_ENV=production npm start
```

## 📞 Suporte

### Plataformas
- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)

### Comunidade
- **Railway Discord:** [discord.gg/railway](https://discord.gg/railway)
- **Vercel Discord:** [vercel.com/discord](https://vercel.com/discord)

---

**🎉 Parabéns! Sua aplicação KIXIKILA está agora em produção!**

**URLs de Produção:**
- Frontend: https://kixikila.vercel.app
- Backend: https://kixikila-backend-production.up.railway.app
- API: https://kixikila-backend-production.up.railway.app/api/v1

**Próximos Passos:**
1. Configurar monitoramento contínuo
2. Implementar backups regulares
3. Configurar alertas de segurança
4. Planejar atualizações regulares
5. Monitorar performance e custos