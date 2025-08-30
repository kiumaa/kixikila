import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/stores/useAppStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '@/components/design-system/Avatar';
import { ThemeToggle } from '@/components/design-system/ThemeToggle';

export const AppHeader: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { unreadNotifications } = useAppStore();
  const { user } = useAuthStore();

  // Header configuration based on route
  const getHeaderConfig = () => {
    const path = location.pathname;
    
    if (path === '/app' || path === '/app/') {
      return {
        title: `Olá, ${user?.full_name?.split(' ')[0] || 'User'} 👋`,
        showBack: false,
        showNotifications: true,
        showProfile: true
      };
    }
    
    if (path.startsWith('/app/wallet')) {
      return {
        title: 'Carteira Digital',
        showBack: true,
        showNotifications: true,
        showProfile: false
      };
    }
    
    if (path.startsWith('/app/groups')) {
      if (path.includes('/create')) {
        return {
          title: 'Criar Grupo',
          showBack: true,
          showNotifications: false,
          showProfile: false
        };
      }
      if (path.match(/\/app\/groups\/[^\/]+$/)) {
        return {
          title: 'Detalhes do Grupo',
          showBack: true,
          showNotifications: true,
          showProfile: false
        };
      }
      return {
        title: 'Grupos',
        showBack: true,
        showNotifications: true,
        showProfile: false
      };
    }
    
    if (path.startsWith('/app/profile')) {
      return {
        title: 'Perfil',
        showBack: true,
        showNotifications: false,
        showProfile: false
      };
    }
    
    if (path.startsWith('/app/vip')) {
      return {
        title: 'VIP',
        showBack: true,
        showNotifications: false,
        showProfile: false
      };
    }
    
    if (path.startsWith('/app/referrals')) {
      return {
        title: 'Convidar Amigos',
        showBack: true,
        showNotifications: false,
        showProfile: false
      };
    }
    
    if (path.startsWith('/app/notifications')) {
      return {
        title: 'Notificações',
        showBack: true,
        showNotifications: false,
        showProfile: false
      };
    }
    
    return {
      title: 'KIXIKILA',
      showBack: false,
      showNotifications: true,
      showProfile: true
    };
  };

  const config = getHeaderConfig();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="flex items-center justify-between h-16 px-4 max-w-md mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          {config.showBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div>
            <h1 className="font-semibold text-foreground font-system">
              {config.title}
            </h1>
            {location.pathname === '/app' && (
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('pt-PT', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            )}
          </div>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {config.showNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/notifications')}
              className="relative p-2 hover:bg-muted"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </Badge>
              )}
            </Button>
          )}
          
          {config.showProfile && user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app/profile')}
              className="p-1 hover:bg-muted"
            >
              <Avatar
                name={user.full_name}
                image={user.avatar_url}
                size="sm"
                className="ring-2 ring-primary/20"
              />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};