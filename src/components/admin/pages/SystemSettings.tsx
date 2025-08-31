import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Simplified SystemSettings component for Supabase Edge Functions setup
export const SystemSettings: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          As configurações do sistema foram migradas para Edge Functions. 
          Configure os serviços diretamente no Supabase Dashboard.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure as credenciais de email no Supabase Edge Functions.
            </p>
            <a 
              href="https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/functions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Abrir Supabase Functions →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              SMS Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure as credenciais do BulkSMS no Supabase Edge Functions.
            </p>
            <a 
              href="https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/functions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Gerir Secrets →
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Stripe Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure as chaves do Stripe no Supabase Edge Functions.
            </p>
            <a 
              href="https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/settings/functions" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Gerir Secrets →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};