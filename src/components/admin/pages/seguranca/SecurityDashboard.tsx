import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Users,
  Activity,
  Eye,
  Lock
} from 'lucide-react';

const SecurityDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Segurança</h2>
        <p className="text-gray-600">
          Monitoramento de segurança e alertas do sistema
        </p>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Status Geral</p>
                <p className="text-2xl font-bold text-green-600">Seguro</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold text-yellow-600">3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Sessões Ativas</p>
                <p className="text-2xl font-bold text-blue-600">127</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos/Hora</p>
                <p className="text-2xl font-bold text-purple-600">45</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Alertas de Segurança Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Tentativas de login suspeitas</p>
                <p className="text-sm text-gray-600">IP: 192.168.1.100 - há 2 minutos</p>
              </div>
              <button className="text-yellow-600 hover:text-yellow-700">
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">API rate limit excedido</p>
                <p className="text-sm text-gray-600">Endpoint: /api/auth - há 15 minutos</p>
              </div>
              <button className="text-red-600 hover:text-red-700">
                <Eye className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Lock className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Nova sessão de admin</p>
                <p className="text-sm text-gray-600">User: admin@kixikila.com - há 1 hora</p>
              </div>
              <button className="text-blue-600 hover:text-blue-700">
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;