# KIXIKILA - Lista de Verificação para Produção

## ✅ FASE 1: Configurações de Segurança (CRÍTICO)

### 1.1 Supabase Security
- [ ] **Auth OTP Expiry**: Configurar para 10 minutos no dashboard Supabase
  - Ir para: Authentication > Settings > Auth Configuration
  - Definir "Auth session timeout" para 600 segundos
- [ ] **Leaked Password Protection**: Ativar no dashboard Supabase
  - Ir para: Authentication > Settings > Password Protection
  - Ativar "Enable password breach protection"
- [ ] **URL Configuration**: Configurar URLs de redirecionamento
  - Site URL: `https://kixikila.pro`
  - Redirect URLs: `https://kixikila.pro/auth/callback`, `https://www.kixikila.pro/auth/callback`

### 1.2 Secrets Configuration (Configurado ✅)
- [x] STRIPE_SECRET_KEY
- [x] BULKSMS_USERNAME  
- [x] BULKSMS_PASSWORD
- [x] JWT_SECRET
- [x] ADMIN_PASSWORD

### 1.3 Variáveis de Ambiente de Produção
- [ ] **Backend (.env.production)**: Configurar todas as variáveis com valores reais
- [ ] **Frontend (.env.production)**: Atualizar URLs e chaves públicas

## ✅ FASE 2: Backend Deployment

### 2.1 Railway Setup
- [ ] Criar conta no Railway (https://railway.app)
- [ ] Conectar repositório GitHub
- [ ] Configurar build command: `cd backend && npm ci --only=production`
- [ ] Configurar start command: `cd backend && npm start`
- [ ] Configurar todas as variáveis de ambiente do arquivo `.env.production`

### 2.2 Domain Configuration
- [ ] Configurar domínio personalizado: `api.kixikila.pro`
- [ ] Verificar certificado SSL automático
- [ ] Configurar health check endpoint: `/api/v1/health`

## ✅ FASE 3: Frontend Deployment

### 3.1 Build Configuration
- [ ] Verificar build local: `npm run build`
- [ ] Testar build localmente: `npm run preview`
- [ ] Verificar todas as variáveis de ambiente

### 3.2 Netlify/Vercel Deployment
- [ ] Deploy no Netlify ou Vercel
- [ ] Configurar domínio: `kixikila.pro`
- [ ] Configurar redirect rules para SPA
- [ ] Verificar certificado SSL

## ✅ FASE 4: DNS Configuration

### 4.1 Domain Records
- [ ] **A Record**: `@` → `185.158.133.1` (para frontend)
- [ ] **CNAME Record**: `www` → `kixikila.pro`
- [ ] **CNAME Record**: `api` → `your-railway-domain.railway.app`
- [ ] **MX Records**: Configurar para email (opcional)

## ✅ FASE 5: Integrações

### 5.1 Stripe Integration
- [ ] Configurar produtos no Stripe Dashboard
- [ ] Configurar webhooks: `https://api.kixikila.pro/api/v1/webhooks/stripe`
- [ ] Testar pagamentos em modo test primeiro
- [ ] Ativar modo live quando testado

### 5.2 BulkSMS Integration
- [ ] Verificar créditos disponíveis
- [ ] Testar envio de SMS
- [ ] Configurar sender ID: "KIXIKILA"

### 5.3 Email Integration
- [ ] Configurar SMTP com provedores (Gmail, SendGrid, etc.)
- [ ] Configurar SPF records no DNS
- [ ] Testar envio de emails

## ✅ FASE 6: Testing

### 6.1 End-to-End Testing
- [ ] **Registro de usuário**: Email + SMS OTP
- [ ] **Login**: Email/senha + 2FA
- [ ] **Funcionalidades VIP**: Teste completo
- [ ] **Pagamentos**: Fluxo completo Stripe
- [ ] **Notificações**: SMS e Email

### 6.2 Performance Testing
- [ ] Lighthouse audit > 90 pontos
- [ ] Teste de carga básico
- [ ] Tempo de resposta API < 500ms
- [ ] CDN e cache funcionando

## ✅ FASE 7: Monitoring

### 7.1 Health Checks
- [ ] **Frontend**: https://kixikila.pro (status 200)
- [ ] **Backend**: https://api.kixikila.pro/health (status 200)
- [ ] **Edge Functions**: Supabase Functions ativadas

### 7.2 Analytics
- [ ] Lovable Insights configurado
- [ ] Google Analytics (opcional)
- [ ] Error tracking configurado

## ✅ FASE 8: Final Checks

### 8.1 Security Final
- [ ] HTTPS forçado em todos os domínios
- [ ] Headers de segurança configurados
- [ ] Dados sensíveis não expostos
- [ ] Logs de produção funcionando

### 8.2 Backup & Recovery
- [ ] Backup automático Supabase ativo
- [ ] Plano de rollback preparado
- [ ] Documentação atualizada

## 🚨 ITENS CRÍTICOS ANTES DO GO-LIVE

1. **Configurar Auth OTP Expiry no Supabase** (atualmente muito longo)
2. **Ativar Leaked Password Protection no Supabase**
3. **Configurar URLs de redirecionamento Auth**
4. **Atualizar todas as chaves Stripe para LIVE mode**
5. **Configurar credenciais BulkSMS reais**
6. **Gerar JWT_SECRET e SESSION_SECRET seguros para produção**

## 📞 Suporte

- **Supabase**: https://supabase.com/dashboard/support
- **Railway**: https://docs.railway.app/
- **Stripe**: https://dashboard.stripe.com/support
- **BulkSMS**: https://www.bulksms.com/support/

---

**Nota**: Esta checklist deve ser seguida sequencialmente. Não pule etapas críticas de segurança!