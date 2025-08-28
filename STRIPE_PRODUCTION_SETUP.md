# KIXIKILA - Configuração do Stripe para Produção

Este guia irá ajudá-lo a configurar o Stripe para processar pagamentos em produção na aplicação KIXIKILA.

## 📋 Pré-requisitos

- [ ] Conta no [Stripe](https://stripe.com)
- [ ] Verificação de identidade completa no Stripe
- [ ] Conta bancária configurada para recebimentos
- [ ] Backend em produção funcionando

## 🔑 Configuração de Chaves de API

### 1. Obter Chaves de Produção

1. **Acesse o Stripe Dashboard**
   - Vá para [dashboard.stripe.com](https://dashboard.stripe.com)
   - Faça login na sua conta
   - **IMPORTANTE:** Certifique-se de estar no modo "Live" (não "Test")

2. **Obter Chaves de API**
   - Vá para **Developers > API keys**
   - Copie as seguintes chaves:
     - **Publishable key** (pk_live_...)
     - **Secret key** (sk_live_...) - ⚠️ MANTENHA SEGURA!

### 2. Configurar Variáveis de Ambiente

**Backend (.env.production):**
```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_sua_chave_secreta_aqui
STRIPE_PUBLIC_KEY=pk_live_sua_chave_publica_aqui
STRIPE_WEBHOOK_SECRET=whsec_sua_webhook_secret_aqui
```

**Frontend (.env.production):**
```env
# Stripe Configuration
VITE_STRIPE_PUBLIC_KEY=pk_live_sua_chave_publica_aqui
```

## 🔗 Configuração de Webhooks

### 1. Criar Webhook Endpoint

1. **No Stripe Dashboard**
   - Vá para **Developers > Webhooks**
   - Clique em **Add endpoint**

2. **Configurar Endpoint**
   - **Endpoint URL:** `https://sua-api-url.railway.app/api/v1/stripe/webhook`
   - **Description:** `KIXIKILA Production Webhooks`

3. **Selecionar Eventos**
   Marque os seguintes eventos:
   ```
   ✅ customer.subscription.created
   ✅ customer.subscription.updated
   ✅ customer.subscription.deleted
   ✅ invoice.payment_succeeded
   ✅ invoice.payment_failed
   ✅ payment_intent.succeeded
   ✅ payment_intent.payment_failed
   ✅ setup_intent.succeeded
   ✅ setup_intent.setup_failed
   ```

4. **Obter Webhook Secret**
   - Após criar o webhook, clique nele
   - Copie o **Signing secret** (whsec_...)
   - Adicione à variável `STRIPE_WEBHOOK_SECRET`

### 2. Testar Webhook

```bash
# Usar Stripe CLI para testar
stripe listen --forward-to https://sua-api-url.railway.app/api/v1/stripe/webhook
```

## 💰 Configuração de Produtos e Preços

### 1. Criar Produtos

1. **No Stripe Dashboard**
   - Vá para **Products**
   - Clique em **Add product**

2. **Configurar Planos KIXIKILA**

   **Plano Básico:**
   - **Name:** KIXIKILA Básico
   - **Description:** Acesso básico à plataforma KIXIKILA
   - **Pricing:** Recorrente mensal
   - **Price:** 2000 AOA (ou equivalente em USD)
   - **Currency:** USD (ou AOA se disponível)

   **Plano Premium:**
   - **Name:** KIXIKILA Premium
   - **Description:** Acesso premium com funcionalidades avançadas
   - **Pricing:** Recorrente mensal
   - **Price:** 5000 AOA (ou equivalente em USD)

   **Plano VIP:**
   - **Name:** KIXIKILA VIP
   - **Description:** Acesso VIP com todas as funcionalidades
   - **Pricing:** Recorrente mensal
   - **Price:** 10000 AOA (ou equivalente em USD)

3. **Anotar Price IDs**
   - Copie os **Price IDs** (price_...) de cada plano
   - Adicione ao código do backend se necessário

### 2. Configurar Métodos de Pagamento

1. **Ativar Métodos de Pagamento**
   - Vá para **Settings > Payment methods**
   - Ative:
     - ✅ Cards (Visa, Mastercard, etc.)
     - ✅ Digital wallets (se disponível em Angola)
     - ✅ Bank transfers (se disponível)

2. **Configurar Moedas**
   - Vá para **Settings > Account details**
   - Configure moedas aceitas:
     - USD (principal)
     - EUR (se necessário)
     - AOA (se disponível)

## 🛡️ Configuração de Segurança

### 1. Configurar Radar (Prevenção de Fraude)

1. **Ativar Radar**
   - Vá para **Radar > Rules**
   - Ative regras básicas de prevenção de fraude

2. **Configurar Regras Personalizadas**
   ```
   # Bloquear tentativas suspeitas
   Block if :card_country: != 'AO' and :amount: > 10000
   
   # Revisar pagamentos de alto valor
   Review if :amount: > 50000
   
   # Bloquear IPs suspeitos
   Block if :ip_country: in ['CN', 'RU'] and :amount: > 5000
   ```

### 2. Configurar 3D Secure

1. **Ativar 3D Secure**
   - Vá para **Settings > Payment methods**
   - Em **Cards**, ative **3D Secure**
   - Configure para **Automatic** ou **Required**

### 3. Configurar Limites

```javascript
// No código do backend, adicionar limites
const PAYMENT_LIMITS = {
  daily: 100000, // 100,000 AOA por dia
  monthly: 1000000, // 1,000,000 AOA por mês
  single: 50000 // 50,000 AOA por transação
};
```

## 📊 Configuração de Relatórios

### 1. Configurar Relatórios Automáticos

1. **Ativar Relatórios**
   - Vá para **Reports > Report runs**
   - Configure relatórios mensais:
     - Balance summary
     - Payout reconciliation
     - Fees summary

### 2. Configurar Notificações

1. **Email Notifications**
   - Vá para **Settings > Notifications**
   - Configure notificações para:
     - ✅ Failed payments
     - ✅ Successful payments (resumo diário)
     - ✅ Disputes
     - ✅ Payouts

## 🔄 Configuração de Payouts

### 1. Configurar Conta Bancária

1. **Adicionar Conta Bancária**
   - Vá para **Settings > Payouts**
   - Adicione conta bancária angolana
   - Verifique informações bancárias

2. **Configurar Cronograma**
   - **Frequency:** Daily (recomendado)
   - **Delay:** 2 days (padrão)

### 2. Configurar Moeda de Payout

```
# Se disponível, configure para AOA
# Caso contrário, use USD e converta localmente
Payout Currency: USD
Bank Account: Conta em USD no banco angolano
```

## 🧪 Testes em Produção

### 1. Testes de Integração

```bash
# Testar criação de customer
curl -X POST https://sua-api-url.railway.app/api/v1/stripe/customer \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Testar criação de payment intent
curl -X POST https://sua-api-url.railway.app/api/v1/stripe/payment-intent \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "currency": "usd", "description": "Test payment"}'
```

### 2. Testes de Webhook

```bash
# Usar Stripe CLI para simular eventos
stripe trigger payment_intent.succeeded
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.created
```

### 3. Testes de Frontend

1. **Testar Fluxo de Pagamento**
   - Criar conta de teste
   - Adicionar método de pagamento
   - Fazer assinatura de plano
   - Verificar webhook recebido

2. **Testar Cenários de Erro**
   - Cartão recusado
   - Cartão expirado
   - Fundos insuficientes

## 📱 Configuração Mobile (Se Aplicável)

### 1. Configurar Apple Pay

```javascript
// Adicionar domínio verificado
Domain: kixikila.com
Merchant ID: merchant.com.kixikila.app
```

### 2. Configurar Google Pay

```javascript
// Configurar merchant info
Merchant Name: KIXIKILA
Merchant ID: BCR2DN4T2LQPQHQR (exemplo)
```

## ✅ Checklist de Verificação

### Configuração Básica
- [ ] Conta Stripe verificada e ativa
- [ ] Chaves de API de produção configuradas
- [ ] Webhook endpoint criado e testado
- [ ] Produtos e preços configurados
- [ ] Métodos de pagamento ativados

### Segurança
- [ ] Radar ativado
- [ ] 3D Secure configurado
- [ ] Regras de fraude definidas
- [ ] Limites de pagamento configurados
- [ ] Webhook secret configurado

### Operacional
- [ ] Conta bancária configurada
- [ ] Cronograma de payouts definido
- [ ] Relatórios automáticos ativados
- [ ] Notificações configuradas
- [ ] Testes de integração realizados

### Compliance
- [ ] Termos de serviço atualizados
- [ ] Política de privacidade atualizada
- [ ] Política de reembolso definida
- [ ] Documentação fiscal preparada

## 🚨 Troubleshooting

### Problemas Comuns

1. **Webhook não recebido**
   ```bash
   # Verificar logs do Stripe
   # Testar endpoint manualmente
   curl -X POST https://sua-api-url.railway.app/api/v1/stripe/webhook
   ```

2. **Pagamento recusado**
   ```
   # Verificar:
   - Cartão válido
   - Fundos suficientes
   - Regras do Radar
   - Limites configurados
   ```

3. **Erro de autenticação**
   ```
   # Verificar:
   - Chaves de API corretas
   - Modo Live vs Test
   - Permissões da chave
   ```

### Logs e Monitoramento

```javascript
// Adicionar logs detalhados
logger.info('Stripe payment attempt', {
  customerId,
  amount,
  currency,
  paymentMethodId
});

logger.error('Stripe payment failed', {
  error: error.message,
  code: error.code,
  type: error.type
});
```

## 📞 Suporte

### Contatos Importantes

1. **Suporte Stripe**
   - Email: support@stripe.com
   - Chat: Disponível no dashboard
   - Documentação: https://stripe.com/docs

2. **Suporte Técnico KIXIKILA**
   - Verificar logs do servidor
   - Analisar webhooks no Stripe
   - Testar endpoints individualmente

### Recursos Úteis

- [Stripe Testing](https://stripe.com/docs/testing)
- [Webhook Testing](https://stripe.com/docs/webhooks/test)
- [Error Codes](https://stripe.com/docs/error-codes)
- [Best Practices](https://stripe.com/docs/security/guide)

---

**⚠️ IMPORTANTE:** 
- Nunca compartilhe suas chaves secretas
- Sempre teste em ambiente de desenvolvimento primeiro
- Mantenha backups das configurações
- Monitore transações regularmente

**🎉 Parabéns! Seu Stripe está configurado para produção!**