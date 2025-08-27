# KIXIKILA - Guia de Deploy para Produção

Este guia irá ajudá-lo a fazer o deploy da aplicação KIXIKILA para produção.

## 📋 Pré-requisitos

- [ ] Conta no [Supabase](https://supabase.com) (banco de dados)
- [ ] Conta no [Stripe](https://stripe.com) (pagamentos)
- [ ] Conta no [BulkSMS](https://bulksms.com) (SMS)
- [ ] Serviço de email configurado
- [ ] Domínio próprio (opcional)

## 🚀 Opções de Deploy

### 1. Railway (Recomendado)

**Vantagens:**
- Setup simples e rápido
- Integração com GitHub
- SSL automático
- Escalabilidade automática
- Plano gratuito disponível

**Passos:**

1. **Criar conta no Railway**
   ```bash
   # Instalar Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   ```

2. **Preparar o projeto**
   ```bash
   cd backend
   
   # Copiar variáveis de ambiente
   cp .env.production .env
   
   # Editar variáveis de produção
   # Configure todas as variáveis necessárias
   ```

3. **Deploy**
   ```bash
   # Inicializar projeto Railway
   railway init
   
   # Fazer deploy
   railway up
   
   # Configurar variáveis de ambiente no Railway dashboard
   railway open
   ```

### 2. Render

**Vantagens:**
- Plano gratuito
- Deploy automático do GitHub
- SSL incluído

**Passos:**

1. Conectar repositório GitHub no [Render](https://render.com)
2. Configurar como "Web Service"
3. Definir:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node.js
4. Adicionar variáveis de ambiente

### 3. Heroku

**Vantagens:**
- Plataforma madura
- Muitos add-ons
- Fácil escalabilidade

**Passos:**

1. **Instalar Heroku CLI**
   ```bash
   # Criar app
   heroku create kixikila-backend
   
   # Configurar variáveis
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your_jwt_secret
   # ... outras variáveis
   
   # Deploy
   git push heroku main
   ```

## 🔧 Configuração do Frontend

Após o deploy do backend, atualize o frontend:

1. **Atualizar URL da API**
   ```typescript
   // src/config/api.ts
   export const API_BASE_URL = 'https://sua-api-url.railway.app/api/v1';
   ```

2. **Build e deploy no Netlify**
   ```bash
   cd frontend
   npm run build
   
   # Deploy manual ou conectar GitHub
   ```

## 🗄️ Configuração do Banco de Dados

1. **Criar projeto no Supabase**
   - Acesse [Supabase](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL e as chaves

2. **Executar schema**
   ```sql
   -- Copie e execute o conteúdo de backend/database/schema.sql
   -- no SQL Editor do Supabase
   ```

3. **Configurar RLS (Row Level Security)**
   ```sql
   -- Ativar RLS nas tabelas necessárias
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE financial_groups ENABLE ROW LEVEL SECURITY;
   -- ... outras tabelas
   ```

## 💳 Configuração do Stripe

1. **Webhook Endpoints**
   ```
   URL: https://sua-api-url.railway.app/api/v1/webhooks/stripe
   Eventos: payment_intent.succeeded, payment_intent.payment_failed
   ```

2. **Variáveis de ambiente**
   ```env
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 📱 Configuração do SMS

1. **BulkSMS**
   ```env
   BULKSMS_USERNAME=seu_username
   BULKSMS_PASSWORD=sua_password
   BULKSMS_BASE_URL=https://api.bulksms.com/v1
   ```

## 🔐 Configuração de Segurança

1. **JWT Secret**
   ```bash
   # Gerar secret seguro
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **CORS**
   ```env
   CORS_ORIGIN=https://seu-dominio.com,https://seu-app.netlify.app
   ```

3. **Rate Limiting**
   ```env
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

## 📊 Monitoramento

1. **Logs**
   - Configure logs estruturados
   - Use serviços como LogRocket ou Sentry

2. **Health Checks**
   ```
   GET https://sua-api-url.railway.app/api/v1/health
   ```

3. **Uptime Monitoring**
   - UptimeRobot
   - Pingdom
   - StatusCake

## 🌐 Configuração de Domínio

1. **Backend (Railway)**
   ```
   # No dashboard do Railway
   Settings > Domains > Add Custom Domain
   ```

2. **Frontend (Netlify)**
   ```
   # No dashboard do Netlify
   Domain Settings > Add Custom Domain
   ```

3. **DNS Configuration**
   ```
   # Exemplo para Cloudflare
   A    api.seudominio.com    -> IP do Railway
   CNAME www.seudominio.com  -> seu-app.netlify.app
   ```

## ✅ Checklist de Deploy

### Backend
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e schema aplicado
- [ ] Webhooks do Stripe configurados
- [ ] Serviços de SMS e email testados
- [ ] SSL configurado
- [ ] Logs e monitoramento ativos

### Frontend
- [ ] URL da API atualizada
- [ ] Build de produção testado
- [ ] Deploy no Netlify realizado
- [ ] Domínio personalizado configurado
- [ ] HTTPS ativo

### Testes
- [ ] Registro de usuário funcionando
- [ ] Login funcionando
- [ ] Criação de grupos funcionando
- [ ] Pagamentos Stripe funcionando
- [ ] Notificações SMS funcionando
- [ ] Todas as APIs respondendo

## 🚨 Troubleshooting

### Problemas Comuns

1. **CORS Errors**
   ```env
   # Verificar CORS_ORIGIN
   CORS_ORIGIN=https://seu-frontend-url.netlify.app
   ```

2. **Database Connection**
   ```env
   # Verificar URLs do Supabase
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   ```

3. **Stripe Webhooks**
   ```bash
   # Testar webhook
   curl -X POST https://sua-api-url.railway.app/api/v1/webhooks/stripe
   ```

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Teste os endpoints individualmente
3. Confirme as variáveis de ambiente
4. Verifique a conectividade do banco de dados

---

**🎉 Parabéns! Sua aplicação KIXIKILA está agora em produção!**