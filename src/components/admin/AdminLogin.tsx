import React, { useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/design-system/LoadingSpinner';
import { useForm } from 'react-hook-form';
import kixikilaLogo from '@/assets/kixikila-logo.png';

interface LoginForm {
  email: string;
  password: string;
}

const AdminLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const { login, error: authError, clearError, user: currentUser } = useAuthStore();
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');
    clearError();
    
    try {
      const result = await login(data.email, data.password);
      
      if (result.success) {
        // O login foi bem-sucedido, aguardar atualização do estado
        setTimeout(() => {
          setIsLoading(false);
        }, 100);
      } else {
        setError(result.message || 'Credenciais inválidas');
        setIsLoading(false);
      }
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="w-full max-w-6xl mx-auto">{/* Constrain max width for better desktop layout */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-8 pt-12">
              <img src={kixikilaLogo} alt="KIXIKILA" className="w-20 h-20 mx-auto mb-6" />
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Painel Administrativo
              </CardTitle>
              <p className="text-gray-600 text-lg">
                Acesso restrito para administradores
              </p>
            </CardHeader>

            <CardContent className="px-12 pb-12">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">{/* Center form with max width */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    {...register('email', { 
                      required: 'Email é obrigatório',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email inválido'
                      }
                    })}
                    className="pl-12 py-3 text-base"
                    placeholder="admin@kixikila.pro"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-600 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                    className="pl-12 pr-12 py-3 text-base"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-600 text-sm">{errors.password.message}</p>
                )}
              </div>

              {(error || authError) && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <p className="text-red-700 text-sm font-medium">{error || authError}</p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner />
                    <span className="ml-2">Autenticando...</span>
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              </form>

              {/* Credenciais do admin */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200 max-w-md mx-auto">
                <p className="text-sm font-semibold text-blue-700 mb-3">
                  🔐 Credenciais de Administrador:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-600">admin@kixikila.pro</span>
                    <code className="bg-blue-100 px-2 py-1 rounded text-blue-700">@Kixikila2025!</code>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-xs text-blue-600">
                    💡 <strong>Nota:</strong> Este é o painel administrativo oficial do Kixikila. Acesso restrito apenas para administradores autorizados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;