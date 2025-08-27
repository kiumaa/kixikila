import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/hooks/use-dark-mode';

const ICON_LIGHT = 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso1.png';
const ICON_DARK = 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso2.png';

export const PWAInstallBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { isDark } = useDarkMode();

  useEffect(() => {
    const dismissed = localStorage.getItem('kixikila-pwa-banner-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (!dismissed && !isStandalone) {
      // Show banner after a small delay for better UX
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstallClick = () => {
    // Mock functionality - just visual for now
    console.log('Install app clicked');
  };

  const handleDismiss = () => {
    localStorage.setItem('kixikila-pwa-banner-dismissed', 'true');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div 
      role="region"
      aria-label="Instalação da app KIXIKILA"
      className="fixed inset-x-0 top-0 z-[60] animate-fade-in"
    >
      <div className="bg-card border-b border-border shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={isDark ? ICON_DARK : ICON_LIGHT}
                alt="Ícone da app KIXIKILA"
                className="w-10 h-10 rounded-lg shadow-sm"
                loading="eager"
              />
              <div>
                <p className="text-sm font-semibold text-card-foreground">
                  <strong>KIXIKILA</strong>: Faça o download da app
                </p>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Acesso mais rápido e funcionalidades offline
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
                Instalar App
              </Button>
              
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors ios-button"
                aria-label="Fechar banner"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};