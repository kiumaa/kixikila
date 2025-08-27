import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/use-dark-mode';
import { useAdminStore } from '@/store/useAdminStore';

interface PWAInstallBannerProps {
  currentRoute?: string;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ currentRoute = '/dashboard' }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { isDark, theme } = useDarkMode();
  const { pwaConfig } = useAdminStore();
  
  const config = pwaConfig.downloadPopup;

  useEffect(() => {
    // Check if banner should be shown based on configuration
    if (!config.enabled) return;
    
    // Check if current route is in the visible routes
    if (!config.showOnPages.includes(currentRoute)) return;
    
    const dismissed = localStorage.getItem('kixikila-pwa-banner-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Don't show if dismissed and showOnce is true
    if (dismissed && config.showOnce) return;
    
    // Don't show if already in standalone mode
    if (isStandalone) return;
    
    // Show banner after configured delay
    const timer = setTimeout(() => setShowBanner(true), config.showAfterSeconds * 1000);
    setTimeoutId(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [config, currentRoute]);

  const handleInstallClick = () => {
    // Mock functionality - just visual for now
    console.log('Install app clicked');
  };

  const handleDismiss = () => {
    if (config.showOnce) {
      localStorage.setItem('kixikila-pwa-banner-dismissed', 'true');
    }
    setShowBanner(false);
  };

  // Determine which icon to use based on theme configuration
  const getIconSrc = () => {
    if (config.theme === 'light') return config.icons.light;
    if (config.theme === 'dark') return config.icons.dark;
    // Auto mode - use current theme
    return isDark ? config.icons.dark : config.icons.light;
  };

  if (!showBanner) return null;

  const positionClasses = config.position === 'bottom' 
    ? 'fixed inset-x-0 bottom-0'
    : 'fixed inset-x-0 top-0';

  return (
    <div 
      role="region"
      aria-label="Instalação da app KIXIKILA"
      className={`${positionClasses} z-[60] animate-fade-in`}
    >
      <div className="bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={getIconSrc()}
                alt="Ícone da app KIXIKILA"
                className="w-10 h-10 rounded-lg shadow-sm"
                loading="eager"
              />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  {config.title}
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {config.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handleInstallClick}
                size="sm"
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium ios-button"
              >
                <Download className="w-3 h-3 mr-1.5" />
                {config.buttonText}
              </Button>
              
              {config.dismissible && (
                <button
                  onClick={handleDismiss}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors ios-button"
                  aria-label="Fechar banner"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};