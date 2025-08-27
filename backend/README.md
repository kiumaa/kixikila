# KIXIKILA Backend

Backend API para a plataforma KIXIKILA de gestão de grupos financeiros colaborativos.

## 🚀 Configuração Inicial

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Conta Supabase
- Conta Stripe (opcional)
- Conta BulkSMS (opcional)

### Instalação

1. **Clone o repositório e instale dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` com suas credenciais reais:
   
   **Obrigatórias:**
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave anônima do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY`: Chave de service role do Supabase
   - `JWT_SECRET`: Chave secreta para JWT (gere uma aleatória)
   
   **Opcionais:**
   - `STRIPE_SECRET_KEY`: Para pagamentos VIP
   - `BULKSMS_USERNAME/PASSWORD`: Para notificações SMS
   - `EMAIL_*`: Para notificações por email

3. **Configure o banco de dados:**
   ```bash
   npm run db:setup
   ```

4. **Verifique a configuração:**
   ```bash
   npm run health
   ```

### Scripts Disponíveis

- `npm run dev` - Inicia servidor em modo desenvolvimento
- `npm run build` - Compila TypeScript para JavaScript
- `npm run start` - Inicia servidor em produção
- `npm run test` - Executa testes
- `npm run lint` - Verifica código com ESLint
- `npm run health` - Verifica saúde dos serviços

#### Scripts de Base de Dados

- `npm run db:setup` - Configura schema e dados iniciais
- `npm run db:reset` - Reseta e recria toda a base de dados
- `npm run db:verify` - Verifica se tabelas existem
- `npm run db:config` - Configura dados iniciais do sistema
- `npm run db:admin` - Cria utilizador administrador
- `npm run db:drop` - Remove todas as tabelas (⚠️ DESTRUTIVO)

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── config/          # Configurações da aplicação
├── controllers/     # Controladores das rotas
├── middleware/      # Middlewares personalizados
├── routes/          # Definição das rotas
├── services/        # Serviços externos (Supabase, Stripe, etc.)
├── utils/           # Utilitários e helpers
├── validations/     # Esquemas de validação Joi
├── scripts/         # Scripts de manutenção
└── server.ts        # Ponto de entrada da aplicação
```

### Tecnologias Utilizadas

- **Framework:** Express.js com TypeScript
- **Base de Dados:** PostgreSQL via Supabase
- **Autenticação:** JWT + Supabase Auth
- **Pagamentos:** Stripe
- **SMS:** BulkSMS
- **Email:** Nodemailer
- **Logging:** Winston
- **Validação:** Joi
- **Testes:** Jest

## 🔧 Configuração do Supabase

### 1. Criar Projeto Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves do projeto

### 2. Configurar Autenticação

1. No painel Supabase, vá para **Authentication > Settings**
2. Configure:
   - **Site URL:** `http://localhost:8080` (desenvolvimento)
   - **Redirect URLs:** `http://localhost:8080/**`
   - **Email Templates:** Personalize conforme necessário

### 3. Configurar RLS (Row Level Security)

O script `db:setup` configura automaticamente as políticas RLS.

## 🔐 Segurança

### Variáveis de Ambiente Sensíveis

⚠️ **NUNCA** commite o arquivo `.env` com credenciais reais!

### Geração de Chaves Seguras

```bash
# JWT Secret (256-bit)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Session Secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 📊 Monitorização

### Logs

Os logs são armazenados em:
- `logs/app.log` - Logs gerais
- `logs/error.log` - Apenas erros
- `logs/combined.log` - Todos os logs (produção)

### Health Check

```bash
npm run health
```

Verifica:
- ✅ Conexão Supabase
- ✅ Configuração Stripe
- ✅ Configuração BulkSMS
- ✅ Configuração Email
- ✅ Estrutura da base de dados

## 🚀 Deploy

### Variáveis de Ambiente para Produção

```bash
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://kixikila.com
# ... outras variáveis
```

### Build e Start

```bash
npm run build
npm run start:prod
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Cobertura de código
npm run test:coverage
```

## 📝 API Documentation

A documentação da API estará disponível em:
- Desenvolvimento: `http://localhost:3001/api-docs`
- Produção: `https://api.kixikila.com/api-docs`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte técnico:
- Email: dev@kixikila.com
- Issues: [GitHub Issues](https://github.com/kixikila/backend/issues)

---

**KIXIKILA** - Transformando a forma como as pessoas poupam em grupo! 💰✨