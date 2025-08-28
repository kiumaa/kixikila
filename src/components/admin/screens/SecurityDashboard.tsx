import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle, Eye, Activity, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/data/mockData';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface SecurityMetrics {
  total_events_24h: number;
  auth_events: number;
  admin_events: number;
  security_events: number;
  financial_events: number;
  failed_logins: number;
  unique_ips: number;
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  created_at: string;
  resolved: boolean;
  ip_address?: string;
  user_id?: string;
}

const SecurityDashboard: React.FC = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    total_events_24h: 0,
    auth_events: 0,
    admin_events: 0,
    security_events: 0,
    financial_events: 0,
    failed_logins: 0,
    unique_ips: 0
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('security-alerts');
      
      if (error) throw error;

      setAlerts(data.alerts || []);
      setMetrics(data.metrics || {});
      setLastUpdate(data.analysis_timestamp || new Date().toISOString());
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSecurityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(a => a.severity === 'HIGH').length;
  const activeAlerts = alerts.filter(a => !a.resolved).length;

  // Mock trend data for charts
  const securityTrend = [
    { time: '00:00', events: 12, threats: 0 },
    { time: '04:00', events: 8, threats: 1 },
    { time: '08:00', events: 45, threats: 2 },
    { time: '12:00', events: 78, threats: 1 },
    { time: '16:00', events: 65, threats: 0 },
    { time: '20:00', events: 92, threats: 3 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
          <p className="text-gray-600">
            Monitorização de segurança em tempo real • Última atualização: {formatDateTime(lastUpdate)}
          </p>
        </div>
        <Button onClick={fetchSecurityData} disabled={loading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  ALERTA CRÍTICO DE SEGURANÇA
                </h3>
                <p className="text-red-700">
                  {criticalAlerts} alertas críticos detectados. Ação imediata necessária.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Eventos (24h)</p>
                <p className="text-2xl font-bold text-blue-900">{metrics.total_events_24h}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Alertas Ativos</p>
                <p className="text-2xl font-bold text-orange-900">{activeAlerts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Logins Falhados</p>
                <p className="text-2xl font-bold text-red-900">{metrics.failed_logins}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">IPs Únicos</p>
                <p className="text-2xl font-bold text-purple-900">{metrics.unique_ips}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Security Events Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Eventos de Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={securityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="events" 
                  stackId="1"
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Eventos"
                />
                <Area 
                  type="monotone" 
                  dataKey="threats" 
                  stackId="2"
                  stroke="#ef4444" 
                  fill="#ef4444" 
                  fillOpacity={0.8}
                  name="Ameaças"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Event Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Eventos por Tipo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Autenticação</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.auth_events / metrics.total_events_24h) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{metrics.auth_events}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Administração</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.admin_events / metrics.total_events_24h) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{metrics.admin_events}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Segurança</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.security_events / metrics.total_events_24h) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{metrics.security_events}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Financeiro</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(metrics.financial_events / metrics.total_events_24h) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{metrics.financial_events}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Alertas de Segurança Ativos ({alerts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">A carregar alertas...</span>
            </div>
          ) : alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.slice(0, 10).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <AlertTriangle className={`w-5 h-5 mt-1 ${
                    alert.severity === 'CRITICAL' ? 'text-red-500' :
                    alert.severity === 'HIGH' ? 'text-orange-500' :
                    alert.severity === 'MEDIUM' ? 'text-yellow-500' : 'text-blue-500'
                  }`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatDateTime(alert.created_at)}</span>
                      {alert.ip_address && <span>IP: {alert.ip_address}</span>}
                      <span>Tipo: {alert.type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-700 mb-1">Sistema Seguro</h3>
              <p className="text-green-600">Nenhum alerta de segurança ativo</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;