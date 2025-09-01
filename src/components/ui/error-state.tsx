'use client'

import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface ErrorStateProps {
  title?: string
  message?: string
  action?: {
    label: string
    onClick: () => void
  }
  showHomeButton?: boolean
  icon?: React.ReactNode
  className?: string
}

export function ErrorState({
  title = 'Algo correu mal',
  message = 'Ocorreu um erro inesperado. Tente novamente.',
  action,
  showHomeButton = true,
  icon,
  className = ''
}: ErrorStateProps) {
  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <Card className={`p-8 text-center max-w-md mx-auto ${className}`}>
      <div className="mb-6">
        {icon || (
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
        )}
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      </div>

      <div className="space-y-3">
        {action && (
          <Button
            onClick={action.onClick}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {action.label}
          </Button>
        )}
        
        {showHomeButton && (
          <Button
            onClick={handleGoHome}
            variant="secondary"
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Button>
        )}
      </div>
    </Card>
  )
}