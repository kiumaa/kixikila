'use client'

import { Wifi, WifiOff, Clock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useOfflineSync } from '@/hooks/use-offline-sync'

export function OfflineIndicator() {
  const { isOnline, hasPendingActions, pendingActions } = useOfflineSync()

  if (isOnline && !hasPendingActions) return null

  return (
    <Card className="fixed top-20 left-4 right-4 z-40 p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isOnline 
              ? 'bg-emerald-100 text-emerald-600' 
              : 'bg-amber-100 text-amber-600'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              {hasPendingActions && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {pendingActions.length} pendentes
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {!isOnline 
                ? 'As suas ações serão sincronizadas quando voltar online'
                : hasPendingActions 
                  ? 'A sincronizar ações pendentes...'
                  : 'Tudo sincronizado'
              }
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}