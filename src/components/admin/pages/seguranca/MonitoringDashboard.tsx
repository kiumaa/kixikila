import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Server,
  Database,
  Globe,
  Zap
} from 'lucide-react';

const MonitoringDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Monitoramento em Tempo Real</h2>
        <p className="text-gray-600">
          Status dos serviços e métricas de performance
        </p>
      </div>

      {/* Service Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">API Backend</p>
                <p className="text-xs text-green-700">Operacional</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Base de Dados</p>
                <p className="text-xs text-green-700">Conectada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">SMS Service</p>
                <p className="text-xs text-yellow-700">Lenta resposta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">CDN</p>
                <p className="text-xs text-green-700">Global</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Métricas de Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tempo de Resposta API</span>
                <span className="font-semibold text-green-600">125ms</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uso de CPU</span>
                <span className="font-semibold text-blue-600">45%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Uso de Memória</span>
                <span className="font-semibold text-orange-600">67%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '67%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>SMS service latência alta detectada</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Base de dados backup concluído</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MonitoringDashboard;