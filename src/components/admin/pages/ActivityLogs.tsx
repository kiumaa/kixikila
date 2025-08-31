import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Download, Shield, AlertTriangle, Users, CreditCard, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { formatDateTime } from '@/lib/mockData';

interface AuditLog {
  id: string;
  entity_type: string;
  action: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  new_values?: any;
  old_values?: any;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
}

interface SecurityAlert {
  id: string;
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  created_at: string;
  resolved: boolean;
}

const ActivityLogs: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<any>({});

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-audit-logs', {
        body: {
          page: currentPage,
          limit: 20,
          event_type: filterType === 'all' ? null : filterType
        }
      });

      if (error) throw error;

      setAuditLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('security-alerts');
      if (error) throw error;
      setSecurityAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching security alerts:', error);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    fetchSecurityAlerts();
  }, [currentPage, filterType]);

  const getEventIcon = (entityType: string) => {
    switch (entityType) {
      case 'AUTH': return <Users className="w-4 h-4 text-blue-500" />;
      case 'ADMIN': return <Shield className="w-4 h-4 text-purple-500" />;
      case 'FINANCIAL': return <CreditCard className="w-4 h-4 text-green-500" />;
      case 'SECURITY': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Data', 'Tipo', 'Ação', 'Usuário', 'IP', 'User Agent'].join(','),
      ...auditLogs.map(log => [
        formatDateTime(log.created_at),
        log.entity_type,
        log.action,
        log.users?.full_name || 'Sistema',
        log.ip_address || '-',
        log.user_agent?.substring(0, 50) || '-'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h2>
          <p className="text-gray-600">
            {auditLogs.length} registos encontrados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAuditLogs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Alertas de Segurança ({securityAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {securityAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{alert.title}</span>
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(alert.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-700">{summary.total_today || 0}</div>
            <div className="text-xs text-blue-600">Total Hoje</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-700">{summary.auth_events || 0}</div>
            <div className="text-xs text-green-600">Autenticação</div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-700">{summary.admin_actions || 0}</div>
            <div className="text-xs text-purple-600">Admin</div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-700">{summary.security_events || 0}</div>
            <div className="text-xs text-orange-600">Segurança</div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50 border-emerald-200">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-700">{summary.financial_events || 0}</div>
            <div className="text-xs text-emerald-600">Financeiro</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Eventos</SelectItem>
                <SelectItem value="AUTH">Autenticação</SelectItem>
                <SelectItem value="ADMIN">Administração</SelectItem>
                <SelectItem value="FINANCIAL">Financeiro</SelectItem>
                <SelectItem value="SECURITY">Segurança</SelectItem>
                <SelectItem value="DATA_ACCESS">Acesso a Dados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Registos de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">A carregar...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className="mt-1">
                    {getEventIcon(log.entity_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">{log.action}</span>
                      <Badge variant="outline" className="text-xs">
                        {log.entity_type}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-2">
                      <div>
                        <span className="font-medium">Usuário:</span> {log.users?.full_name || 'Sistema'}
                      </div>
                      <div>
                        <span className="font-medium">IP:</span> {log.ip_address || '-'}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span> {formatDateTime(log.created_at)}
                      </div>
                    </div>
                    {log.user_agent && (
                      <div className="text-xs text-gray-500 mt-1">
                        <span className="font-medium">User Agent:</span> {log.user_agent.substring(0, 100)}...
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {auditLogs.length === 0 && !loading && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhum registo encontrado</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;