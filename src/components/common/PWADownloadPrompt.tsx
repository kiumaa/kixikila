import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';
import { useDarkMode } from '@/hooks/use-dark-mode';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const PWADownloadPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { isDark } = useDarkMode();

  useEffect(() => {
    const dismissed = localStorage.getItem('kixikila-pwa-dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (dismissed || isStandalone) return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        localStorage.setItem('kixikila-pwa-dismissed', 'true');
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('kixikila-pwa-dismissed', 'true');
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <Card className="bg-card border-border shadow-lg mx-4 mt-4 max-w-md mx-auto">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img
              src={isDark 
                ? 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso2.png'
                : 'https://raw.githubusercontent.com/kiumaa/kixikila/main/Kixikila%20Brand/iso1.png'
              }
              alt="KIXIKILA Logo"
              className="w-10 h-10 rounded-lg shadow-sm"
              loading="eager"
            />
            <div className="flex-1">
              <p className="text-sm font-semibold font-system text-foreground">
                KIXIKILA: Faça o download da app
              </p>
              <p className="text-xs text-muted-foreground">
                Acesso mais rápido e funcionalidades offline
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-3">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-primary hover:bg-primary-hover text-primary-foreground font-medium ios-button"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Instalar
            </Button>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors ios-button"
              aria-label="Fechar"
            >
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};