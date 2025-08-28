# KIXIKILA - Documentação de Rotas

## Estrutura de URLs

### URLs Implementadas
- **`kixikila.pro/`** - Página inicial com onboarding
- **`kixikila.pro/entrar`** - Login e registro (?type=login|register)
- **`kixikila.pro/app`** - Aplicação principal (protegida)
- **`kixikila.pro/admin/*`** - Painel administrativo (protegido)

## Arquitetura de Roteamento

### 1. React Router (Nível Superior)
```typescript
// App.tsx - Roteamento principal
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/entrar" element={<AuthPage />} />
  <Route path="/app" element={<ProtectedRoute><AppPage /></ProtectedRoute>} />
  <Route path="/admin/*" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
</Routes>
```

### 2. State-based Navigation (App Principal)
```typescript
// AppPage.tsx - Navegação interna por estado
const [currentScreen, setCurrentScreen] = useState('dashboard');
// Telas: dashboard, wallet, profile, notifications, etc.
```

### 3. Proteção de Rotas
```typescript
// ProtectedRoute.tsx
- Verifica autenticação
- Redireciona não autenticados para /entrar
- Redireciona autenticados de páginas públicas para /app
```

## Páginas Implementadas

### HomePage (/)
- **Função**: Onboarding para novos usuários
- **Redirecionamento**: Usuários logados → `/app`
- **Navegação**: 
  - Próximo → `/entrar?type=register`
  - Pular → `/entrar?type=login`

### AuthPage (/entrar)
- **Função**: Login e registro combinados
- **Parâmetros URL**: `?type=login|register`
- **Redirecionamento**: Usuários logados → `/app`
- **Estados**: Alterna entre login e registro

### AppPage (/app)
- **Função**: Aplicação principal protegida
- **Proteção**: Requer autenticação
- **Navegação**: State-based para telas internas
- **Features**: Dashboard, carteira, perfil, grupos, etc.

### AdminPanel (/admin/*)
- **Função**: Painel administrativo
- **Proteção**: Requer autenticação + role admin
- **Navegação**: React Router interno
- **URLs**: `/admin/dashboard`, `/admin/users`, etc.

## Sistema de Navegação

### Bottom Navigation
- **Visibilidade**: Apenas em `/app`
- **Controle**: State-based dentro da AppPage
- **Itens**: Dashboard, Carteira, Criar, Notificações, Perfil

### Redirecionamentos Automáticos
```typescript
// Fluxo de autenticação
Não autenticado + rota protegida → /entrar
Autenticado + página pública → /app
Login/Register success → /app
Logout → /
```

## Proteção e Segurança

### ProtectedRoute Component
- Verifica `isAuthenticated` do store
- Mostra loading durante verificação
- Preserva URL de destino para redirect pós-login
- Funciona com todas as rotas protegidas

### Middleware de Autenticação
- Store Zustand persiste estado
- Supabase gerencia sessões
- Auto-refresh de tokens
- Logout automático em erro

## Backend API Routes

### Base URL
- **Desenvolvimento**: `http://localhost:3001/api/v1/`
- **Produção**: `https://kixikila-backend.railway.app/api/v1/`

### Categorias de Rotas

#### 🔓 Rotas Públicas
```
POST /auth/register           # Registro de usuário
POST /auth/login              # Login 
POST /auth/send-otp           # Enviar OTP
POST /auth/verify-otp         # Verificar OTP
POST /auth/resend-otp         # Reenviar OTP
POST /auth/refresh-token      # Atualizar token
GET  /health                  # Status da API
```

#### 🔒 Rotas Protegidas (JWT Required)
```
# Usuários
GET    /users/profile         # Perfil do usuário
PUT    /users/profile         # Atualizar perfil
GET    /users/stats           # Estatísticas do usuário

# Grupos
GET    /groups                # Listar grupos do usuário
POST   /groups                # Criar grupo
GET    /groups/:id            # Detalhes do grupo
PUT    /groups/:id            # Atualizar grupo
DELETE /groups/:id            # Deletar grupo
POST   /groups/:id/join       # Entrar no grupo
POST   /groups/:id/leave      # Sair do grupo
POST   /groups/:id/pay        # Pagar contribuição

# Transações
GET    /transactions          # Histórico de transações
POST   /transactions/deposit  # Depositar fundos
POST   /transactions/withdraw # Sacar fundos

# Notificações
GET    /notifications         # Listar notificações
PUT    /notifications/:id/read # Marcar como lida
POST   /notifications/settings # Configurar notificações
```

#### 👑 Rotas Admin (Admin Role Required)
```
GET    /admin/dashboard       # Dashboard admin
GET    /admin/users           # Gerenciar usuários
GET    /admin/groups          # Gerenciar grupos
GET    /admin/transactions    # Todas as transações
GET    /admin/analytics       # Analytics
POST   /admin/notifications/broadcast # Enviar notificação em massa
```

#### 💳 Rotas Stripe
```
POST   /stripe/create-payment-intent    # Criar intenção de pagamento
POST   /stripe/webhook                  # Webhook do Stripe
GET    /stripe/payment-methods          # Métodos de pagamento
```

#### 🎣 Webhooks
```
POST   /webhooks/stripe       # Webhook do Stripe
POST   /webhooks/sms          # Webhook SMS
```

## Vantagens da Nova Arquitetura

### URLs Limpos e Profissionais
- ✅ Estrutura intuitiva para usuários
- ✅ Melhor para SEO e compartilhamento
- ✅ URLs memoráveis e brandeable

### Separação Clara de Contextos
- ✅ Onboarding isolado na homepage
- ✅ Auth centralizado em uma página
- ✅ App principal protegido e funcional
- ✅ Admin separado com roteamento próprio

### Melhor UX
- ✅ Redirecionamentos automáticos inteligentes
- ✅ Preservação de estado na app principal
- ✅ Loading states consistentes
- ✅ Navegação fluida e responsiva

### Manutenibilidade
- ✅ Código organizado por contexto
- ✅ Responsabilidades bem definidas
- ✅ Fácil adição de novas rotas/páginas
- ✅ Sistema de proteção reutilizável

## Considerações Técnicas

### Performance
- Lazy loading de componentes pesados
- Suspense boundaries estratégicos
- Memoização de navegação
- Code splitting automático

### Compatibilidade
- Funciona em todos os browsers modernos
- URLs funcionam com bookmark e refresh
- Histórico de navegação preservado
- Suporte a PWA nativo

### Escalabilidade
- Fácil adição de novas rotas principais
- Sistema de modais mantido na app
- Admin panel pode crescer independentemente
- Store centralizado para estado global

## Organização de Arquivos

### Frontend Atualizado
```
src/
├── pages/           # Páginas principais
│   ├── HomePage.tsx    # Homepage com onboarding (/)
│   ├── AuthPage.tsx    # Login/Register (/entrar)
│   ├── AppPage.tsx     # App principal (/app)
│   ├── AdminPanel.tsx  # Painel admin (/admin/*)
│   └── NotFound.tsx    # 404
├── routes/          # Configuração de rotas
│   └── LazyRoutes.tsx  # Lazy loading
└── components/      # Componentes
    ├── layout/
    │   └── BottomNavigation.tsx
    └── auth/
        └── ProtectedRoute.tsx
```

### Backend
```
backend/src/routes/
├── auth.ts          # Rotas de autenticação
├── users.ts         # Rotas de usuários
├── groups.ts        # Rotas de grupos
├── transactions.ts  # Rotas de transações
├── notifications.ts # Rotas de notificações
├── admin.ts         # Rotas admin
├── stripe.ts        # Integração Stripe
├── webhooks.ts      # Webhooks
└── health.ts        # Health check
```

## Convenções

### Nomenclatura
#### Backend
- Rotas em inglês, kebab-case
- Verbos HTTP semânticos
- Parâmetros em camelCase

#### Frontend  
- URLs em português quando apropriado
- Componentes em PascalCase
- Hooks com prefixo `use`

### Estrutura de Arquivos
- Agrupamento por funcionalidade
- Separação clara de responsabilidades
- Reutilização de componentes

### Segurança
- Todas as rotas protegidas requerem JWT válido
- Rate limiting em todas as rotas públicas
- Audit log para ações sensíveis
- Validação de entrada em todas as rotas