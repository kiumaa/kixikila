# KIXIKILA - Aplicação de Poupança Colaborativa

## Visão Geral
KIXIKILA é uma aplicação Progressive Web App (PWA) para poupança colaborativa, permitindo que utilizadores criem e participem em grupos de poupança com sistemas de sorteio e ordem predefinida.

## 🚀 Demo Live
**URL do Projeto**: https://lovable.dev/projects/4e4e1ded-793e-43c0-9876-3b8c8b4e722c

---

## 📁 Estrutura do Projeto

### Organização de Pastas
```
src/
├── components/          # Componentes reutilizáveis
│   ├── auth/           # Autenticação e login
│   ├── dashboard/      # Componentes do dashboard
│   ├── error/          # Error boundaries e handling
│   ├── groups/         # Gestão de grupos
│   ├── invite/         # Sistema refer-a-friend
│   ├── modals/         # Modais e diálogos
│   ├── notifications/  # Sistema de notificações
│   ├── profile/        # Perfil do utilizador
│   ├── ui/            # Componentes base da UI
│   └── wallet/        # Carteira digital
├── hooks/             # Custom React hooks
│   └── use-gesture.ts # Gestos e pull-to-refresh
├── lib/               # Utilitários e helpers
│   ├── animations.ts  # Sistema de animações
│   ├── auth-context.tsx # Contexto de autenticação
│   ├── haptic-feedback.ts # Feedback tátil
│   └── utils.ts       # Utilitários gerais
├── pages/             # Páginas principais
└── types/             # Definições TypeScript
```

---

## 🎯 Funcionalidades Principais

### 1. 🔐 Sistema de Autenticação
- **Localização**: `src/components/auth/`
- **Fluxo**: Telefone → OTP SMS → Setup PIN → Dashboard
- **Funcionalidades**:
  - Login com número de telemóvel
  - Verificação via código SMS
  - Setup de PIN de 6 dígitos
  - Persistência de sessão segura
  - Verificação KYC mock

### 2. 📊 Dashboard Inteligente
- **Localização**: `src/pages/dashboard-content.tsx`
- **Componentes**:
  - Cartão de saldo (tap para ir à carteira)
  - Estatísticas do utilizador
  - Lista de grupos ativos
  - Grupos recomendados
  - Ações rápidas (criar, depositar, convidar)
  - Notificações em tempo real

### 3. 👥 Sistema de Grupos
- **Localização**: `src/components/groups/`
- **Wizard de Criação** (4 passos):
  1. **Info**: Nome, descrição, valor
  2. **Tipo**: Sorteio vs Ordem predefinida
  3. **Regras**: Frequência, penalizações
  4. **Convites**: Adicionar membros
- **Detalhes do Grupo** (4 tabs):
  - **Visão Geral**: Progresso, próximo contemplado
  - **Membros**: Lista com status de pagamento
  - **Histórico**: Ciclos anteriores
  - **Regras**: Configurações do grupo
- **Funcionalidades**:
  - Animação confetti no sorteio
  - Gestão de membros (adicionar/remover)
  - Sistema de avisos por incumprimento

### 4. 💰 Carteira Digital
- **Localização**: `src/components/wallet/`
- **Funcionalidades**:
  - Saldo em destaque com toggle visibilidade
  - Lista completa de transações
  - **Modais integrados**:
    - Depósito (mock Stripe)
    - Levantamento (mock IBAN)
    - Pagamento de ciclo
  - Filtros por tipo de transação
  - Export PDF (preparado)
  - Skeleton loaders durante carregamento

### 5. 🔔 Sistema de Notificações
- **Localização**: `src/components/notifications/`
- **Tipos de Notificação**:
  - Pagamentos pendentes
  - Sorteios realizados
  - Convites aceites
  - Upgrades VIP
- **Funcionalidades**:
  - Pull-to-refresh nativo
  - Marcar como lida/eliminar
  - Contador no ícone do sino
  - Animações suaves

### 6. 👑 Sistema VIP
- **Localização**: `src/components/modals/vip-upgrade-modal.tsx`
- **Planos Disponíveis**:
  - **Premium** (€9.99/mês): Grupos ilimitados, estatísticas
  - **Pro** (€19.99/mês): API access, relatórios personalizados
- **Integração**: Mock Stripe Checkout
- **Benefícios**: Badge VIP, funcionalidades exclusivas

### 7. 🎁 Refer-a-Friend
- **Localização**: `src/components/invite/`
- **Funcionalidades**:
  - Código de convite único
  - Link partilhável
  - Lista de amigos convidados
  - Contador de meses VIP ganhos
  - Partilha nativa (Web Share API)

---

## 🎨 Sistema de Design & UX

### Componentes UI Avançados
- **Enhanced Button**: Haptic feedback + animações
- **Animated Page**: Transições suaves + swipe back
- **Pull to Refresh**: Gesto nativo de atualização
- **Error Boundary**: Gestão global de erros
- **Skeleton Loaders**: Estados de carregamento consistentes

### Design System
- **Semantic Tokens**: `tailwind.config.ts` + CSS variables
- **Dark/Light Mode**: Suporte completo automático
- **Animações**: Biblioteca personalizada em `animations.ts`
- **Haptic Feedback**: Vibrações contextuais (`haptic-feedback.ts`)

### Experiência Nativa (PWA)
- **Gestos Tácteis**:
  - Swipe para voltar
  - Pull-to-refresh
  - Tap com feedback háptico
- **Estados Visuais**:
  - Loading states em todas as ações
  - Confirmações visuais
  - Animações de transição
- **Modo Offline**:
  - Service Worker robusto
  - Cache de recursos críticos
  - Página offline personalizada

---

## 📱 Arquitetura PWA

### Service Worker (`public/sw.js`)
- **Cache Strategy**: Cache-first para performance
- **Recursos Cached**: Páginas principais, assets, API calls
- **Push Notifications**: Preparado para notificações push
- **Background Sync**: Sincronização offline (preparado)

### Web App Manifest (`public/manifest.json`)
- **Instalável**: Comporta-se como app nativo
- **Shortcuts**: Atalhos para ações rápidas
- **Share Target**: Integração com partilha do sistema
- **Categories**: Finance, Productivity, Social

### Otimizações de Performance
- **Lazy Loading**: Componentes e imagens
- **Code Splitting**: Por rota e funcionalidade
- **Bundle Optimization**: Tree shaking automático
- **Critical CSS**: Inlined para primeiro render

---

## 🔧 Hooks Personalizados

### `useAuth`
- **Localização**: `src/lib/auth-context.tsx`
- **Funcionalidades**: Gestão de estado global de autenticação
- **Métodos**: `signUp`, `verifyOTP`, `setupPIN`, `signIn`, `signOut`

### `useSwipeGesture`
- **Localização**: `src/hooks/use-gesture.ts`
- **Funcionalidades**: Detecção de gestos tácteis
- **Suporte**: Swipe em 4 direções com threshold configurável

### `usePullToRefresh`
- **Localização**: `src/hooks/use-gesture.ts`
- **Funcionalidades**: Pull-to-refresh nativo
- **Integração**: Feedback visual + haptic

---

## 🚦 Fluxos de Utilizador

### 1. Onboarding Completo
```
Splash → Apresentação (3 slides) → Escolha Login/Registo → 
Telefone → OTP → PIN → KYC → Dashboard
```

### 2. Criação de Grupo
```
Dashboard → [+] Criar → Info → Tipo → Regras → Convites → 
Confirmação → Partilha → Dashboard
```

### 3. Participação em Grupo
```
Procurar/Convite → Detalhes → Aderir → Pagamento → 
Confirmação → Notificação → Histórico
```

### 4. Ciclo de Pagamento
```
Notificação → Grupo → Pagar → Escolher Fonte → 
Confirmar → Processar → Feedback → Atualizar Status
```

### 5. Sistema de Sorteio
```
Todos Pagaram → Admin Sorteia → Animação → 
Notificar Todos → Atualizar Histórico → Próximo Ciclo
```

---

## 💾 Gestão de Estado

### Dados Mock Realistas
- **Utilizadores**: Perfis completos com estatísticas
- **Grupos**: Diferentes tipos e estados  
- **Transações**: Histórico diversificado
- **Notificações**: Vários tipos e estados

### Persistência Local
- **Session Storage**: Estado de autenticação
- **Local Storage**: Preferências do utilizador
- **Cache Storage**: Resources e API responses

---

## 🔒 Segurança & Validação

### Autenticação Mock
- **Validação**: Email, telefone, PIN
- **Sessões**: Gestão segura com timeouts
- **KYC**: Processo de verificação simulado

### Validação de Dados
- **Formulários**: Validação em tempo real
- **Tipos**: TypeScript strict mode
- **Sanitização**: Input sanitization

---

## 📊 Performance & Métricas

### Otimizações Implementadas
- **Lazy Loading**: Componentes não críticos
- **Image Optimization**: Responsive images
- **Bundle Splitting**: Por rota e feature
- **Tree Shaking**: Eliminação de código morto

### Métricas Alvo
- **FCP**: < 1.5s (First Contentful Paint)
- **LCP**: < 2.5s (Largest Contentful Paint)  
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)

---

## 🛠️ Desenvolvimento

### Scripts Disponíveis
```bash
# Desenvolvimento
npm run dev          # Servidor local com HMR

# Build
npm run build        # Build otimizado para produção
npm run preview      # Preview do build local

# Qualidade
npm run type-check   # Verificação TypeScript
npm run lint         # ESLint check
```

### Stack Tecnológica
- **Frontend**: React 18.3 + TypeScript 5.0
- **Build**: Vite 5.0 (ultra-fast bundling)
- **Styling**: Tailwind CSS 3.4 + CSS Variables
- **Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React (tree-shakeable)
- **Routing**: React Router DOM 6.30
- **State**: React Context + Custom Hooks
- **PWA**: Custom Service Worker + Manifest

---

## 📋 Status de Implementação

### ✅ Completamente Implementado
- [x] Sistema de autenticação completo
- [x] Dashboard responsivo e interativo
- [x] Criação e gestão de grupos
- [x] Carteira digital com modais
- [x] Sistema de notificações
- [x] Funcionalidades VIP
- [x] Refer-a-friend system
- [x] PWA completo com offline
- [x] Animações e haptic feedback
- [x] Dark/Light mode
- [x] Error handling robusto

### 🔄 Preparado para Integração
- [ ] Backend real (APIs REST/GraphQL)
- [ ] Stripe pagamentos reais
- [ ] Sistema SMS real
- [ ] Push notifications
- [ ] Analytics e métricas
- [ ] Testes automatizados

---

## 🚀 Deploy e Produção

### Deploy via Lovable
1. Aceder ao [projeto](https://lovable.dev/projects/4e4e1ded-793e-43c0-9876-3b8c8b4e722c)
2. Clicar em "Share" → "Publish"
3. Escolher domínio personalizado (plano pago)

### Deploy Manual
```bash
npm run build        # Gerar build de produção
# Upload da pasta 'dist' para servidor
```

### Ambiente de Produção
- **HTTPS**: Obrigatório para PWA
- **Service Worker**: Ativo automaticamente
- **Caching**: Headers otimizados
- **Compression**: Gzip/Brotli ativo

---

## 📈 Próximos Passos

### Fase 1: Backend Integration
- [ ] API REST com Node.js/Express
- [ ] Base de dados PostgreSQL
- [ ] Sistema de autenticação JWT
- [ ] Integração Stripe real

### Fase 2: Features Avançadas  
- [ ] Chat em grupos
- [ ] Notificações push
- [ ] Sistema de ratings
- [ ] Analytics dashboard

### Fase 3: Escalabilidade
- [ ] Tests unitários e E2E
- [ ] CI/CD pipeline
- [ ] Monitoring e logging
- [ ] Performance optimization

---

## 📞 Suporte

Para questões sobre desenvolvimento ou deployment:
- **Documentação**: [Lovable Docs](https://docs.lovable.dev)
- **Comunidade**: [Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **Projeto**: [Lovable Editor](https://lovable.dev/projects/4e4e1ded-793e-43c0-9876-3b8c8b4e722c)

---

### 🎉 KIXIKILA está pronto para transformar a forma como as pessoas poupam em grupo! 
*Construído com ❤️ usando Lovable + React + TypeScript*