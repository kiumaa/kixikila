import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { BottomNavigation } from './BottomNavigation';
import { AppHeader } from './AppHeader';
import { PWAInstallPrompt } from '@/components/common/PWAInstallPrompt';
import { Toaster } from '@/components/ui/sonner';
import { useAppStore } from '@/stores/useAppStore';
import { cn } from '@/lib/utils';

export const AppLayout: React.FC = () => {
  const { theme, unreadNotifications } = useAppStore();
  const navigate = useNavigate();

  return (
    <div className={cn(
      'min-h-screen bg-background transition-colors duration-300',
      theme === 'dark' && 'dark'
    )}>
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
      
      {/* App Header */}
      <AppHeader />
      
      {/* Main Content */}
      <main className="pb-20 pt-16">
        <Outlet />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        onCreateGroup={() => navigate('/app/groups/create')}
        notificationCount={unreadNotifications}
      />
      
      {/* Toast Notifications */}
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'bg-card text-card-foreground border-border'
        }}
      />
    </div>
  );
};