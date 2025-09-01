'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { RefreshCw, X, Sparkles } from 'lucide-react'
import { usePWAUpdate } from '@/hooks/use-pwa-update'
import { useActionFeedback } from '@/hooks/use-haptic-feedback'

export function UpdatePrompt() {
  const { updateAvailable, isUpdating, updateApp, dismissUpdate } = usePWAUpdate()
  const { success } = useActionFeedback()

  if (!updateAvailable) return null

  const handleUpdate = () => {
    success()
    updateApp()
  }

  return (
    <Card className="fixed top-6 left-6 right-6 z-50 p-4 bg-primary/95 text-primary-foreground backdrop-blur-sm border-primary/20 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-background/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Nova versão disponível</h3>
            <p className="text-xs opacity-90">
              Atualize para a versão mais recente
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={handleUpdate}
            disabled={isUpdating}
            size="sm"
            variant="secondary"
            className="bg-background/20 hover:bg-background/30 text-primary-foreground border-0"
          >
            {isUpdating ? (
              <>
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                A atualizar...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 mr-2" />
                Atualizar
              </>
            )}
          </Button>
          
          <button
            onClick={dismissUpdate}
            disabled={isUpdating}
            className="p-1.5 hover:bg-background/20 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}