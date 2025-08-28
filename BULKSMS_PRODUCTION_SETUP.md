# KIXIKILA - Configuração do BulkSMS para Produção

Este guia irá ajudá-lo a configurar o BulkSMS para envio de mensagens SMS em produção na aplicação KIXIKILA.

## 📋 Pré-requisitos

- [ ] Conta no [BulkSMS](https://www.bulksms.com)
- [ ] Verificação de identidade completa
- [ ] Créditos SMS adicionados à conta
- [ ] Backend em produção funcionando

## 🔑 Configuração de Credenciais

### 1. Criar Conta BulkSMS

1. **Registrar Conta**
   - Vá para [bulksms.com](https://www.bulksms.com)
   - Clique em **Sign Up**
   - Complete o registro com informações da empresa

2. **Verificar Identidade**
   - Faça upload dos documentos necessários
   - Aguarde aprovação (pode levar 1-2 dias úteis)
   - Confirme número de telefone

### 2. Obter Credenciais de API

1. **Acesse o Dashboard**
   - Faça login na sua conta BulkSMS
   - Vá para **API & Integrations**

2. **Criar Token de API**
   - Clique em **Create Token**
   - **Token Name:** `KIXIKILA Production`
   - **Permissions:** 
     - ✅ Send messages
     - ✅ View message history
     - ✅ View account balance
   - Copie o **Token ID** e **Token Secret**

### 3. Configurar Variáveis de Ambiente

**Backend (.env.production):**
```env
# BulkSMS Configuration
BULKSMS_TOKEN_ID=seu_token_id_aqui
BULKSMS_TOKEN_SECRET=seu_token_secret_aqui
BULKSMS_FROM=KIXIKILA
```

**Exemplo de configuração:**
```env
BULKSMS_TOKEN_ID=12345678-1234-1234-1234-123456789012
BULKSMS_TOKEN_SECRET=abcdef1234567890abcdef1234567890
BULKSMS_FROM=KIXIKILA
```

## 📱 Configuração de Sender ID

### 1. Registrar Sender ID

1. **No Dashboard BulkSMS**
   - Vá para **Sender IDs**
   - Clique em **Register Sender ID**

2. **Configurar KIXIKILA**
   - **Sender ID:** `KIXIKILA`
   - **Type:** Alphanumeric
   - **Country:** Angola (AO)
   - **Use Case:** Transactional messages
   - **Sample Message:** "KIXIKILA: Bem-vindo! Sua conta foi criada com sucesso."

3. **Aguardar Aprovação**
   - Processo pode levar 1-5 dias úteis
   - Você receberá email de confirmação
   - Enquanto isso, use número padrão

### 2. Configuração para Angola

```javascript
// Formato de números angolanos
const ANGOLA_PHONE_FORMATS = {
  mobile: [
    '+244 9XX XXX XXX', // Unitel
    '+244 9XX XXX XXX', // Movicel
  ],
  landline: [
    '+244 2XX XXX XXX'  // Fixo
  ]
};
```

## 🔧 Configuração de Mensagens

### 1. Templates de Mensagens

**Mensagens do Sistema:**
```javascript
const SMS_TEMPLATES = {
  welcome: 'KIXIKILA: Bem-vindo {name}! 🎉 Sua conta foi criada. Comece a poupar em grupo!',
  
  otp: 'KIXIKILA: Seu código de verificação é {code}. Válido por 10 minutos. Não compartilhe.',
  
  contribution: 'KIXIKILA: {name}, contribuição de {amount} AOA recebida para o grupo "{group}". Obrigado!',
  
  reminder: 'KIXIKILA: {name}, lembrete: contribuição de {amount} AOA vence em {days} dias para "{group}".',
  
  goalAchieved: 'KIXIKILA: Parabéns! O grupo "{group}" atingiu a meta de {amount} AOA! 🎉',
  
  paymentFailed: 'KIXIKILA: {name}, pagamento de {amount} AOA falhou. Verifique seu método de pagamento.',
  
  subscription: 'KIXIKILA: {name}, assinatura {plan} ativada! Válida até {date}. Aproveite os benefícios!'
};
```

### 2. Configuração de Limites

```javascript
// Limites de SMS
const SMS_LIMITS = {
  daily: 1000,        // 1000 SMS por dia
  hourly: 100,        // 100 SMS por hora
  perUser: 10,        // 10 SMS por usuário por dia
  messageLength: 160, // 160 caracteres por SMS
  retryAttempts: 3    // 3 tentativas em caso de falha
};
```

## 🛡️ Configuração de Segurança

### 1. Configurar Whitelist de IPs

1. **No Dashboard BulkSMS**
   - Vá para **Security Settings**
   - Adicione IPs do servidor de produção:
     ```
     # Railway.app IPs (exemplo)
     34.102.136.180
     35.184.112.0/24
     
     # Adicione os IPs reais do seu servidor
     ```

### 2. Configurar Rate Limiting

```javascript
// Implementar rate limiting no backend
const rateLimiter = {
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 SMS por minuto por usuário
  message: 'Muitas tentativas de envio de SMS. Tente novamente em 1 minuto.'
};
```

### 3. Validação de Números

```javascript
// Validar números angolanos
function validateAngolanPhone(phone) {
  // Remover espaços e caracteres especiais
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Formatos válidos para Angola
  const patterns = [
    /^\+244[9][0-9]{8}$/, // Mobile: +244 9XX XXX XXX
    /^\+244[2][0-9]{8}$/, // Landline: +244 2XX XXX XXX
    /^244[9][0-9]{8}$/,   // Mobile sem +
    /^244[2][0-9]{8}$/,   // Landline sem +
    /^[9][0-9]{8}$/,      // Mobile local
    /^[2][0-9]{8}$/       // Landline local
  ];
  
  return patterns.some(pattern => pattern.test(cleanPhone));
}
```

## 📊 Configuração de Monitoramento

### 1. Configurar Webhooks (Opcional)

```javascript
// Endpoint para receber status de entrega
app.post('/api/v1/webhooks/bulksms', (req, res) => {
  const { id, status, to, errorCode } = req.body;
  
  // Atualizar status da mensagem no banco
  updateSMSStatus(id, status, errorCode);
  
  res.status(200).json({ received: true });
});
```

### 2. Logs e Métricas

```javascript
// Implementar logging detalhado
const smsLogger = {
  sent: (to, message, messageId) => {
    logger.info('SMS sent', {
      to: maskPhoneNumber(to),
      messageId,
      length: message.length,
      timestamp: new Date().toISOString()
    });
  },
  
  failed: (to, error, attempt) => {
    logger.error('SMS failed', {
      to: maskPhoneNumber(to),
      error: error.message,
      attempt,
      timestamp: new Date().toISOString()
    });
  }
};
```

## 💰 Gestão de Créditos

### 1. Adicionar Créditos

1. **No Dashboard BulkSMS**
   - Vá para **Billing**
   - Clique em **Add Credits**
   - Escolha o valor (recomendado: mínimo 1000 créditos)
   - Complete o pagamento

### 2. Configurar Alertas de Saldo

1. **Alertas Automáticos**
   - Vá para **Account Settings**
   - Configure alerta quando saldo < 100 créditos
   - Adicione email para notificações

### 3. Monitorar Uso

```javascript
// Verificar saldo periodicamente
const checkSMSBalance = async () => {
  try {
    const response = await axios.get('https://api.bulksms.com/v1/profile', {
      auth: {
        username: process.env.BULKSMS_TOKEN_ID,
        password: process.env.BULKSMS_TOKEN_SECRET
      }
    });
    
    const balance = response.data.credits.balance;
    
    if (balance < 100) {
      // Enviar alerta para administradores
      await sendLowBalanceAlert(balance);
    }
    
    return balance;
  } catch (error) {
    logger.error('Failed to check SMS balance:', error);
    return null;
  }
};
```

## 🧪 Testes em Produção

### 1. Testes de Integração

```bash
# Testar envio de SMS via API
curl -X POST https://sua-api-url.railway.app/api/v1/admin/test-sms \
  -H "Authorization: Bearer seu_token_admin" \
  -H "Content-Type: application/json" \
  -d '{"testPhone": "+244912345678"}'
```

### 2. Testes de Funcionalidades

**Teste de Boas-vindas:**
```javascript
// Registrar novo usuário e verificar SMS
const testWelcomeSMS = async () => {
  const user = await registerUser({
    email: 'test@example.com',
    phone: '+244912345678',
    fullName: 'Teste Usuario'
  });
  
  // Verificar se SMS foi enviado
  const smsLog = await getSMSLog(user.phone);
  assert(smsLog.length > 0, 'Welcome SMS not sent');
};
```

**Teste de OTP:**
```javascript
// Testar código de verificação
const testOTPSMS = async () => {
  const otp = await generateOTP('+244912345678');
  
  // Verificar se SMS com OTP foi enviado
  const smsLog = await getSMSLog('+244912345678');
  const otpSMS = smsLog.find(sms => sms.message.includes(otp.code));
  
  assert(otpSMS, 'OTP SMS not sent');
};
```

### 3. Testes de Carga

```javascript
// Testar envio em massa
const testBulkSMS = async () => {
  const phones = [
    '+244912345678',
    '+244923456789',
    '+244934567890'
  ];
  
  const promises = phones.map(phone => 
    smsService.sendNotificationSMS(
      phone,
      'Teste',
      'Teste de Carga',
      'Esta é uma mensagem de teste de carga.'
    )
  );
  
  const results = await Promise.all(promises);
  const successCount = results.filter(r => r === true).length;
  
  console.log(`${successCount}/${phones.length} SMS enviados com sucesso`);
};
```

## 📋 Configuração de Compliance

### 1. Opt-out/Unsubscribe

```javascript
// Implementar sistema de opt-out
const SMS_FOOTER = '\n\nPara parar SMS: responda STOP';

const handleOptOut = async (phone, message) => {
  if (message.toLowerCase().includes('stop')) {
    await updateUserSMSPreference(phone, false);
    await smsService.sendSMS({
      to: phone,
      message: 'KIXIKILA: SMS desativado. Para reativar, acesse configurações no app.'
    });
  }
};
```

### 2. Horários de Envio

```javascript
// Respeitar horários comerciais
const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  // Segunda a Sexta: 8h às 18h
  // Sábado: 9h às 13h
  // Domingo: não enviar
  
  if (day === 0) return false; // Domingo
  if (day === 6) return hour >= 9 && hour <= 13; // Sábado
  return hour >= 8 && hour <= 18; // Segunda a Sexta
};
```

## ✅ Checklist de Verificação

### Configuração Básica
- [ ] Conta BulkSMS criada e verificada
- [ ] Token ID e Token Secret obtidos
- [ ] Variáveis de ambiente configuradas
- [ ] Sender ID "KIXIKILA" registrado
- [ ] Créditos SMS adicionados

### Segurança
- [ ] Whitelist de IPs configurada
- [ ] Rate limiting implementado
- [ ] Validação de números implementada
- [ ] Logs de segurança ativados

### Funcionalidades
- [ ] Templates de mensagens configurados
- [ ] Sistema de OTP funcionando
- [ ] Notificações de grupo funcionando
- [ ] Lembretes de pagamento funcionando
- [ ] Sistema de opt-out implementado

### Monitoramento
- [ ] Logs detalhados configurados
- [ ] Alertas de saldo baixo configurados
- [ ] Métricas de entrega monitoradas
- [ ] Webhooks configurados (opcional)

### Compliance
- [ ] Horários comerciais respeitados
- [ ] Sistema de opt-out funcionando
- [ ] Política de privacidade atualizada
- [ ] Termos de uso atualizados

## 🚨 Troubleshooting

### Problemas Comuns

1. **SMS não enviado**
   ```
   Verificar:
   - Saldo de créditos
   - Formato do número
   - Status do Sender ID
   - Logs de erro
   ```

2. **Erro de autenticação**
   ```
   Verificar:
   - Token ID correto
   - Token Secret correto
   - Permissões do token
   - Whitelist de IPs
   ```

3. **Mensagem rejeitada**
   ```
   Verificar:
   - Conteúdo da mensagem
   - Comprimento da mensagem
   - Caracteres especiais
   - Compliance local
   ```

### Códigos de Erro Comuns

```javascript
const ERROR_CODES = {
  '1001': 'Invalid phone number format',
  '1002': 'Insufficient credits',
  '1003': 'Invalid sender ID',
  '1004': 'Message too long',
  '1005': 'Rate limit exceeded',
  '1006': 'Blocked number',
  '1007': 'Invalid message content'
};
```

## 📞 Suporte

### Contatos BulkSMS

1. **Suporte Técnico**
   - Email: support@bulksms.com
   - Chat: Disponível no dashboard
   - Documentação: https://www.bulksms.com/developer/

2. **Suporte Comercial**
   - Email: sales@bulksms.com
   - Telefone: Disponível no site

### Recursos Úteis

- [API Documentation](https://www.bulksms.com/developer/json/v1/)
- [Error Codes](https://www.bulksms.com/developer/json/v1/#errors)
- [Best Practices](https://www.bulksms.com/developer/json/v1/#best-practices)
- [Country-specific Info](https://www.bulksms.com/developer/json/v1/#country-specific-features)

---

**⚠️ IMPORTANTE:** 
- Mantenha suas credenciais seguras
- Monitore o uso de créditos regularmente
- Respeite as leis locais de SMS
- Teste sempre antes de envios em massa

**🎉 Parabéns! Seu BulkSMS está configurado para produção!**