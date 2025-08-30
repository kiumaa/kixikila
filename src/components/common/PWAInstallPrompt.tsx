import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Download } from 'lucide-react';
import { pwaManager } from '@/lib/pwa';

export const PWAInstallPrompt: React.FC = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Show prompt after a delay if app can be installed
    const checkInstallability = () => {
      if (pwaManager.canInstall() && !localStorage.getItem('pwa-prompt-dismissed')) {
        setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // Show after 3 seconds
      }
    };

    checkInstallability();

    // Check periodically
    const interval = setInterval(checkInstallability, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await pwaManager.installApp();
    
    if (success) {
      setShowPrompt(false);
    }
    
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Remember dismissal for 7 days
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 animate-slide-down">
      <Card className="bg-primary text-primary-foreground shadow-xl border-0">
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-foreground/20 rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Instalar KIXIKILA</h3>
            <p className="text-xs text-primary-foreground/80">
              Acesso mais rápido sem browser
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleInstall}
              disabled={isInstalling}
              className="text-primary-foreground hover:bg-primary-foreground/20 h-8 px-3"
            >
              {isInstalling ? 'A instalar...' : 'Instalar'}
            </Button>
            
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-primary-foreground/20 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};