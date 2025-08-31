'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onReset={() => this.setState({ hasError: false })} />
    }

    return this.props.children
  }
}

export function ErrorFallback({ onReset }: { onReset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-xl font-bold text-foreground mb-2">
          Algo correu mal
        </h2>
        
        <p className="text-muted-foreground mb-6">
          Ocorreu um erro inesperado. Pode tentar novamente ou voltar ao início.
        </p>
        
        <div className="flex gap-3">
          <Button 
            variant="secondary" 
            onClick={onReset}
            className="flex-1"
            size="lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex-1"
            size="lg"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir ao Início
          </Button>
        </div>
      </Card>
    </div>
  )
}

// Generic error component for specific errors
export function ErrorMessage({ 
  title = "Erro", 
  message = "Algo correu mal. Tente novamente.", 
  onRetry,
  showRetry = true 
}: {
  title?: string
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}) {
  return (
    <Card className="p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
      <h3 className="font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      )}
    </Card>
  )
}