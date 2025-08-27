import React from 'react';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Carregando...' 
}) => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <Card className="ios-card">
        <CardContent className="p-8 text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="text-muted-foreground font-medium font-system">
            {message}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};