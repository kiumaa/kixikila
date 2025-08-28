import React, { useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Wallet, User, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomNavigationProps {
  onCreateGroup: () => void;
  notificationCount?: number;
}

// Moved inside component for memoization

export const BottomNavigation: React.FC<BottomNavigationProps> = React.memo(({
  onCreateGroup,
  notificationCount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Memoized navigation items
  const navItems = useMemo(() => [
    { key: 'dashboard', icon: Home, label: 'Início', path: '/app/dashboard' },
    { key: 'wallet', icon: Wallet, label: 'Carteira', path: '/app/wallet' },
    { key: 'create', icon: Plus, label: 'Criar', isAction: true },
    { key: 'notifications', icon: Bell, label: 'Notificações', path: '/app/notifications' },
    { key: 'profile', icon: User, label: 'Perfil', path: '/app/profile' }
  ], []);

  // Memoized handlers
  const handleNavigation = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);
  // Hide bottom navigation on auth pages and admin routes
  const isHomePage = window.location.pathname === '/';
  const isAuthPage = window.location.pathname === '/entrar';
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  
  if (isHomePage || isAuthPage || isAdminRoute) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-xl border-t border-border z-40">
      <div className="max-w-md mx-auto px-4 py-2">
        <div className="flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isCreateButton = item.isAction;
            
            if (isCreateButton) {
              return (
                <Button
                  key={item.key}
                  onClick={onCreateGroup}
                  size="lg"
                  className="w-14 h-14 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-200 ios-button"
                  aria-label="Criar grupo"
                >
                  <item.icon className="w-6 h-6" />
                </Button>
              );
            }

            return (
              <button
                key={item.key}
                onClick={() => handleNavigation(item.path!)}
                className={`relative flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-all duration-200 ios-button ${
                  isActive 
                    ? 'text-primary bg-primary/10 scale-105' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                aria-label={item.label}
              >
                <div className="relative">
                  <item.icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'scale-110' : ''}`} />
                  {item.key === 'notifications' && notificationCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold text-[10px] animate-bounce-in">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </div>
                <span className={`text-xs font-medium font-system transition-all duration-200 ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-bounce-in" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});