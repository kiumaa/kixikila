# KIXIKILA - Documentação de Rotas

## Estrutura de Rotas Organizadas

### 1. Backend Routes (API)

**Base URL:** `/api/v1/`

#### Rotas Públicas
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login de usuário  
- `POST /auth/verify-otp` - Verificação OTP
- `POST /auth/resend-otp` - Reenvio OTP
- `POST /auth/forgot-password` - Recuperação de senha
- `POST /auth/reset-password` - Reset de senha
- `POST /auth/refresh-token` - Renovar token
- `GET /health` - Health check

#### Rotas Protegidas (Requer Autenticação)
- `GET /users/profile` - Perfil do usuário
- `PUT /users/profile` - Atualizar perfil
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Alterar senha

#### Rotas de Grupos (Protegidas)
- `GET /groups` - Listar grupos do usuário
- `POST /groups` - Criar grupo
- `GET /groups/:id` - Detalhes do grupo
- `PUT /groups/:id` - Atualizar grupo
- `DELETE /groups/:id` - Deletar grupo
- `POST /groups/:id/join` - Entrar em grupo
- `POST /groups/:id/leave` - Sair do grupo

#### Rotas de Transações (Protegidas)
- `GET /transactions` - Histórico de transações
- `POST /transactions/deposit` - Depósito
- `POST /transactions/withdraw` - Levantamento

#### Rotas de Notificações (Protegidas)
- `GET /notifications` - Listar notificações
- `PUT /notifications/:id/read` - Marcar como lida

#### Rotas de Admin (Requer Admin)
- `GET /admin/users` - Gestão de usuários
- `GET /admin/groups` - Gestão de grupos
- `GET /admin/transactions` - Todas as transações
- `GET /admin/stats` - Estatísticas do sistema
- `GET /admin/config` - Configurações do sistema
- `PUT /admin/config` - Atualizar configurações

#### Rotas do Stripe
- `POST /stripe/create-payment-intent` - Criar intenção de pagamento
- `POST /stripe/confirm-payment` - Confirmar pagamento

#### Webhooks
- `POST /webhooks/stripe` - Webhook do Stripe

### 2. Frontend Routes

#### Aplicação Principal (`/`)

**Rotas Públicas (não autenticadas):**
- `/onboarding` - Tela de apresentação
- `/login` - Tela de login
- `/register` - Tela de registro

**Rotas Protegidas:**
- `/` (redirect para `/dashboard`)
- `/dashboard` - Dashboard principal
- `/wallet` - Carteira digital
- `/notifications` - Notificações
- `/group/:id` - Detalhes do grupo

**Rotas de Perfil:**
- `/profile` - Perfil principal
- `/profile/personal-data` - Dados pessoais
- `/profile/kyc` - Verificação KYC
- `/profile/payment-methods` - Métodos de pagamento
- `/profile/notification-settings` - Configurações de notificação
- `/profile/security` - Segurança
- `/profile/terms` - Termos e condições
- `/profile/support` - Suporte
- `/profile/vip-management` - Gestão VIP

#### Painel de Admin (`/admin/*`)

**Rotas de Admin:**
- `/admin/dashboard` - Dashboard administrativo
- `/admin/users` - Gestão de usuários
- `/admin/groups` - Gestão de grupos
- `/admin/plans` - Gestão de planos
- `/admin/branding` - Gestão de marca
- `/admin/pwa` - Gestão PWA
- `/admin/advanced-settings` - Configurações avançadas
- `/admin/security` - Dashboard de segurança
- `/admin/logs` - Logs de atividade
- `/admin/settings` - Configurações do sistema

### 3. Organização de Arquivos

#### Backend
```
backend/src/routes/
├── auth.ts          # Rotas de autenticação
├── users.ts         # Rotas de usuários
├── groups.ts        # Rotas de grupos
├── transactions.ts  # Rotas de transações  
├── notifications.ts # Rotas de notificações
├── admin.ts         # Rotas administrativas
├── stripe.ts        # Integração Stripe
├── webhooks.ts      # Webhooks externos
└── health.ts        # Health checks
```

#### Frontend
```
src/
├── pages/
│   ├── Index.tsx       # Aplicação principal
│   ├── AdminPanel.tsx  # Painel administrativo
│   └── NotFound.tsx    # Página 404
├── routes/
│   └── LazyRoutes.tsx  # Lazy loading de componentes
└── components/
    ├── layout/
    │   └── BottomNavigation.tsx  # Navegação inferior
    └── auth/
        └── ProtectedRoute.tsx    # Proteção de rotas
```

### 4. Middleware de Segurança

#### Backend
- **Rate Limiting**: Diferentes limites por tipo de rota
- **Authentication**: JWT token validation
- **Authorization**: Role-based access control
- **Audit Logging**: Log de todas as ações importantes
- **CORS**: Configuração de CORS apropriada

#### Frontend  
- **Route Protection**: Proteção baseada em autenticação
- **Admin Protection**: Verificação de permissões de admin
- **Lazy Loading**: Carregamento sob demanda de componentes

### 5. Estado de Navegação

#### Sistema Atual
- Usa estado local (`currentScreen`) para navegação interna
- Mantém histórico de navegação
- Suporte a modais sobrepostos
- Bottom navigation sincronizada

#### Benefícios
- ✅ Controle total sobre navegação
- ✅ Modais gerenciados centralmente
- ✅ Estado de loading consistente
- ✅ Fácil depuração e debug

### 6. Próximos Passos de Otimização

1. **React Router Migration** (Futuro)
   - Migrar para React Router completo
   - URLs diretos para telas específicas
   - Melhor SEO e compartilhamento

2. **Route Preloading**
   - Pre-carregar rotas críticas
   - Otimizar lazy loading

3. **Deep Linking**
   - Suporte a links diretos
   - Parâmetros de rota

4. **Route Guards**
   - Guards mais granulares
   - Verificações de permissão por rota

### 7. Convenções

#### Naming
- Rotas backend: kebab-case (`/user-profile`)
- Rotas frontend: camelCase internal, kebab-case URL
- Componentes: PascalCase

#### Structure  
- Grouping relacionado por funcionalidade
- Separation of concerns clara
- Consistent error handling

#### Security
- Todas as rotas protegidas validadas
- Rate limiting apropriado
- Audit logging completo