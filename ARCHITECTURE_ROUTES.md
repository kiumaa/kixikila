# KIXIKILA - Arquitetura de Rotas

## Visão Geral

O sistema KIXIKILA utiliza uma arquitetura híbrida de roteamento que combina React Router para roteamento de alto nível e gerenciamento de estado para navegação interna da aplicação principal.

## Estrutura Híbrida

### 1. Nível Superior (React Router)
```
App.tsx
├── "/" (catch-all) → Index.tsx (App Principal)
├── "/admin/*" → AdminPanel.tsx (Painel Admin)  
└── "*" → NotFound.tsx (404)
```

### 2. Aplicação Principal (State-based Navigation)
```
Index.tsx - Gerencia navegação via useState
├── Telas de Autenticação
├── Dashboard e funcionalidades principais
├── Perfil e configurações
└── Modais e overlays
```

### 3. Painel Admin (React Router)
```
AdminPanel.tsx - Usa React Router interno
├── /admin/dashboard
├── /admin/users
├── /admin/groups
├── /admin/settings
└── etc...
```

## Razões da Arquitetura Híbrida

### Aplicação Principal (State Management)
**Por que não React Router:**
- ✅ Controle total sobre transições e animações
- ✅ Estado compartilhado entre telas sem prop drilling
- ✅ Modais complexos com contexto mantido
- ✅ Loading states centralizados
- ✅ Melhor UX para aplicação mobile-first
- ✅ Fácil debugging do estado de navegação

### Painel Admin (React Router)
**Por que React Router:**
- ✅ URLs diretos para funcionalidades admin
- ✅ Bookmark de páginas específicas
- ✅ Navegação browser (back/forward)
- ✅ Melhor para interface desktop/web
- ✅ SEO (se necessário no futuro)

## Implementação Técnica

### Backend Routes
```typescript
// server.ts - Organização por funcionalidade
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/groups', authMiddleware, groupRoutes);
app.use('/api/v1/admin', authMiddleware, adminRoutes);
```

### Frontend State Navigation
```typescript
// Index.tsx - Navegação baseada em estado
const [currentScreen, setCurrentScreen] = useState('loading');

const handleNavigation = (screen: string) => {
  if (!isAuthenticated && !publicScreens.includes(screen)) {
    setCurrentScreen('login');
    return;
  }
  setCurrentScreen(screen);
};
```

### Admin React Router
```typescript
// AdminPanel.tsx - React Router tradicional
<Routes>
  <Route path="/dashboard" element={<AdminDashboard />} />
  <Route path="/users" element={<UsersManagement />} />
  <Route path="/groups" element={<GroupsManagement />} />
</Routes>
```

## Middleware e Segurança

### Backend
```typescript
// Camadas de proteção por rota
router.use(authMiddleware);           // Autenticação
router.use(requireAdmin);             // Autorização
router.use(adminRateLimit);           // Rate limiting
router.use(auditAdminAction);         // Audit log
```

### Frontend
```typescript
// Proteção de rotas
<ProtectedRoute requireAuth={true} redirectTo="/">
  <AdminPanel />
</ProtectedRoute>
```

## Lazy Loading Strategy

### Componentes Lazy
```typescript
// LazyRoutes.tsx - Code splitting otimizado
export const DashboardScreen = lazy(() => 
  import('@/features/dashboard/DashboardScreen')
);
```

### Suspense Boundaries
```typescript
// Boundaries estratégicos para UX
<Suspense fallback={<LoadingScreen />}>
  {renderCurrentScreen()}
</Suspense>
```

## Navegação Bottom Navigation

### Integração com Estado
```typescript
// BottomNavigation.tsx - Sincronizada com estado
<BottomNavigation
  currentScreen={currentScreen}
  onNavigate={handleNavigation}
  onCreateGroup={handleCreateGroup}
  notificationCount={unreadNotifications}
/>
```

## Gestão de Modais

### Sistema Centralizado
```typescript
// Estado dos modais gerenciado centralmente
const [showCreateGroup, setShowCreateGroup] = useState(false);
const [showDeposit, setShowDeposit] = useState(false);
const [showWithdraw, setShowWithdraw] = useState(false);

// Renderização condicional
{showCreateGroup && (
  <CreateGroupModal
    isOpen={showCreateGroup}
    onClose={() => setShowCreateGroup(false)}
  />
)}
```

## Vantagens do Sistema Atual

### Performance
- ✅ Componentes carregados sob demanda
- ✅ Estado compartilhado eficiente
- ✅ Minimal re-renders

### UX/UI
- ✅ Transições suaves entre telas
- ✅ Estado preservado durante navegação
- ✅ Loading states consistentes
- ✅ Modais contextuais

### Manutenibilidade
- ✅ Lógica de navegação centralizada
- ✅ Fácil debugging
- ✅ Código organizado por funcionalidade
- ✅ Separação clara de responsabilidades

## Migrações Futuras

### Para React Router Completo
```typescript
// Possível migração futura - se necessário
// Vantagens: URLs diretos, melhor SEO
// Desvantagens: Perda de controle fino sobre UX
```

### Considerações
- **Manter** sistema atual para UX otimizada
- **Avaliar** React Router se URLs diretos forem críticos
- **Híbrido** funciona bem para necessidades atuais

## Conclusão

A arquitetura híbrida atual oferece o melhor dos dois mundos:
- **React Router** onde URLs diretos são importantes (Admin)
- **State Management** onde UX otimizada é prioridade (App Principal)

Este approach é **adequado** para aplicações mobile-first com necessidades admin separadas.