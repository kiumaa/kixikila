import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Here you would typically send the error to your error reporting service
    // Example: Sentry.captureException(error, { contexts: { errorInfo } });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-surface flex items-center justify-center p-6">
          <Card className="ios-card max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-destructive-subtle rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-system text-foreground">
                  Oops! Algo correu mal
                </h2>
                <p className="text-muted-foreground font-system">
                  Ocorreu um erro inesperado. Por favor, tente novamente.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-surface rounded-lg p-4 text-left">
                  <p className="text-xs font-mono text-muted-foreground break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="flex-1 ios-button"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar
                </Button>
                <Button
                  variant="default"
                  onClick={this.handleReset}
                  className="flex-1 ios-button"
                >
                  Tentar novamente
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}