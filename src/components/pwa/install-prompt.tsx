'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { X, Download, Share, Plus, Smartphone } from 'lucide-react'
import { usePWAInstall } from '@/hooks/use-pwa-install'
import { useActionFeedback } from '@/hooks/use-haptic-feedback'

interface InstallPromptProps {
  onClose: () => void
}

export function InstallPrompt({ onClose }: InstallPromptProps) {
  const { installPWA, isIOS, getInstallInstructions } = usePWAInstall()
  const { success } = useActionFeedback()
  const [isInstalling, setIsInstalling] = useState(false)
  
  const instructions = getInstallInstructions()

  const handleInstall = async () => {
    if (isIOS) {
      // Show iOS instructions
      return
    }
    
    setIsInstalling(true)
    try {
      const result = await installPWA()
      if (result === 'accepted') {
        success()
        onClose()
      }
    } catch (error) {
      console.error('Error installing PWA:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  return (
    <Card className="fixed bottom-6 left-6 right-6 z-50 p-6 bg-background/95 backdrop-blur-sm border shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Instalar KIXIKILA</h3>
            <p className="text-sm text-muted-foreground">
              Acesso rápido como aplicação nativa
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {isIOS ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-3">
            Para instalar no iOS:
          </p>
          <div className="space-y-2">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-semibold text-primary">
                  {index + 1}
                </span>
                <span>{step}</span>
                {index === 0 && <Share className="w-4 h-4 text-primary ml-auto" />}
                {index === 1 && <Plus className="w-4 h-4 text-primary ml-auto" />}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                A instalar...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isInstalling}
          >
            Mais tarde
          </Button>
        </div>
      )}
    </Card>
  )
}