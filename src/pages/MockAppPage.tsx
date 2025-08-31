import React from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockAuthStore } from '@/stores/useMockAuthStore';
import { CheckCircle, User, Smartphone, Shield, Home } from 'lucide-react';

const MockAppPage: React.FC = () => {
  const { user, logout } = useMockAuthStore();

  // Redirect to full app if available (in future phases)
  const hasFullApp = false;
  if (hasFullApp) {
    return <Navigate to="/app" replace />;
  }

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-4">🎉 FASE 1 CONCLUÍDA</Badge>
          <h1 className="text-3xl font-bold font-system text-foreground mb-2">
            Bem-vindo, {user.name?.split(' ')[0] || 'Utilizador'}!
          </h1>
          <p className="text-muted-foreground">
            Fluxo OTP e PIN configurados com sucesso
          </p>
        </div>

        {/* Success Card */}
        <Card className="mb-6 ios-card">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-success-subtle rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Autenticação Completa!
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>Nome:</span>
                </div>
                <span className="font-medium">{user.name || 'Não definido'}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span>Telefone:</span>
                </div>
                <span className="font-medium">{user.phone}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>PIN:</span>
                </div>
                <span className="font-medium text-success">✅ Configurado</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6 ios-card">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              🚀 Próximas Fases
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ <strong>Fase 1:</strong> Fluxo OTP com mocks</p>
              <p>⏳ <strong>Fase 2:</strong> Definição e confirmação de PIN</p>
              <p>⏳ <strong>Fase 3:</strong> Login com PIN (sessão confiável)</p>
              <p>⏳ <strong>Fase 4:</strong> Persistência de sessão</p>
              <p>⏳ <strong>Fase 5:</strong> Redirecionamentos e middleware</p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-4">
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full"
            onClick={() => window.location.href = '/app'}
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para App Principal
          </Button>
          
          <Button 
            variant="destructive" 
            size="lg" 
            className="w-full"
            onClick={handleLogout}
          >
            Terminar Sessão
          </Button>
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg text-xs text-muted-foreground">
          <h4 className="font-semibold mb-2">Debug Info:</h4>
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default MockAppPage;