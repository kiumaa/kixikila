import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { Loader2, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface RequireKycProps {
  children: React.ReactNode;
  showMessage?: boolean;
}

const RequireKyc: React.FC<RequireKycProps> = ({ 
  children, 
  showMessage = false 
}) => {
  const { user, isLoading, needsKyc } = useAuthStore();
  const location = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-system">
            Verificando estado KYC...
          </p>
        </div>
      </div>
    );
  }

  // If user needs KYC verification
  if (needsKyc()) {
    if (showMessage) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center space-y-6">
              <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-warning" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">
                  Verificação KYC Necessária
                </h2>
                <p className="text-muted-foreground">
                  Para aceder a esta funcionalidade, precisa de completar a verificação de identidade.
                </p>
              </div>
              
              <Button 
                className="w-full"
                onClick={() => window.location.href = '/kyc'}
              >
                Completar Verificação
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Redirect to KYC with return URL
    return (
      <Navigate 
        to="/kyc" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If KYC is approved or admin, render children
  if (user?.kyc_status === 'approved' || user?.role === 'admin') {
    return <>{children}</>;
  }

  // For rejected KYC status
  if (user?.kyc_status === 'rejected') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-destructive" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-foreground">
                Verificação KYC Rejeitada
              </h2>
              <p className="text-muted-foreground">
                A sua verificação de identidade foi rejeitada. Entre em contacto com o suporte para mais informações.
              </p>
            </div>
            
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/app/profile/support'}
            >
              Contactar Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback - redirect to KYC
  return (
    <Navigate 
      to="/kyc" 
      state={{ from: location.pathname }} 
      replace 
    />
  );
};

export default RequireKyc;