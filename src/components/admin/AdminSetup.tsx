import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

export const AdminSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const createAdminUser = async () => {
    setIsCreating(true);
    setResult(null);
    
    try {
      console.log('Criando usuário admin...');
      
      const { data, error } = await supabase.functions.invoke('create-admin-user', {
        body: {}
      });
      
      if (error) {
        console.error('Erro ao criar admin:', error);
        setResult({
          success: false,
          message: `Erro: ${error.message}`
        });
        return;
      }
      
      console.log('Usuário admin criado:', data);
      setResult({
        success: true,
        message: 'Usuário admin criado com sucesso!'
      });
      
    } catch (err: any) {
      console.error('Erro:', err);
      setResult({
        success: false,
        message: `Erro: ${err.message || 'Erro desconhecido'}`
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md p-8 shadow-2xl">
        <div className="text-center mb-6">
          <Shield className="w-16 h-16 mx-auto mb-4 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Admin</h2>
          <p className="text-gray-600">Criar usuário administrador inicial</p>
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-700 mb-2">
              Credenciais que serão criadas:
            </p>
            <div className="space-y-1 text-sm">
              <div><strong>Email:</strong> admin@kixikila.pro</div>
              <div><strong>Senha:</strong> @Kixikila2025!</div>
            </div>
          </div>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <p className={`text-sm font-medium ${
                  result.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {result.message}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={createAdminUser}
            disabled={isCreating}
            className="w-full"
            variant="default"
          >
            {isCreating ? 'Criando Admin...' : 'Criar Usuário Admin'}
          </Button>

          {result?.success && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Usuário criado! Agora você pode fazer login.
              </p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Recarregar Página
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminSetup;