'use client'

import { AlertTriangle, Wifi, Database, CreditCard, Users, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ErrorState } from './error-state'

// Network Error
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Sem conexão"
      message="Verifique a sua ligação à internet e tente novamente."
      icon={
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wifi className="w-8 h-8 text-amber-600" />
        </div>
      }
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry
      } : undefined}
    />
  )
}

// Server Error  
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Erro no servidor"
      message="Ocorreu um problema no nosso servidor. Tente novamente em alguns instantes."
      icon={
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-8 h-8 text-red-600" />
        </div>
      }
      action={onRetry ? {
        label: 'Tentar Novamente', 
        onClick: onRetry
      } : undefined}
    />
  )
}

// Payment Error
export function PaymentError({ 
  message = "Erro no processamento do pagamento",
  onRetry 
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <ErrorState
      title="Erro de pagamento"
      message={message}
      icon={
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-red-600" />
        </div>
      }
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry
      } : undefined}
      showHomeButton={false}
    />
  )
}

// Group Error
export function GroupError({ 
  message = "Erro ao carregar grupo",
  onRetry 
}: { 
  message?: string
  onRetry?: () => void 
}) {
  return (
    <ErrorState
      title="Erro no grupo"
      message={message}
      icon={
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-orange-600" />
        </div>
      }
      action={onRetry ? {
        label: 'Recarregar',
        onClick: onRetry
      } : undefined}
    />
  )
}

// Loading Error (timeout)
export function LoadingTimeout({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="A demorar muito tempo..."
      message="O carregamento está a demorar mais do que o esperado. Verifique a sua conexão."
      icon={
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
        </div>
      }
      action={onRetry ? {
        label: 'Tentar Novamente',
        onClick: onRetry
      } : undefined}
    />
  )
}

// Maintenance Mode
export function MaintenanceMode() {
  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Em manutenção</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Estamos a actualizar o KIXIKILA para melhor vos servir. Voltaremos em breve.
        </p>
      </div>
      
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          Tempo estimado: 30 minutos<br />
          Para urgências: suporte@kixikila.pt
        </p>
      </div>
    </Card>
  )
}