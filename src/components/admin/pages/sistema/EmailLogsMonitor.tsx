import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Search, RefreshCw, Calendar, Activity, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailLog {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  metadata: any;
  created_at: string;
  ip_address: string | null;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

const EmailLogsMonitor: React.FC = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [stats, setStats] = useState<EmailStats>({ total: 0, sent: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('24h');
  
  useEffect(() => {
    loadEmailLogs();
    loadEmailStats();
  }, [timeFilter]);

  const loadEmailLogs = async () => {
    try {
      setLoading(true);
      
      // Get email logs from audit_logs table
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('entity_type', 'email_sent')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null,
        metadata: log.metadata as any
      })));
    } catch (error: any) {
      console.error('Error loading email logs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar logs de email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEmailStats = async () => {
    try {
      const now = new Date();
      let since = new Date();
      
      switch (timeFilter) {
        case '1h':
          since.setHours(now.getHours() - 1);
          break;
        case '24h':
          since.setDate(now.getDate() - 1);
          break;
        case '7d':
          since.setDate(now.getDate() - 7);
          break;
        case '30d':
          since.setDate(now.getDate() - 30);
          break;
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .select('metadata')
        .eq('entity_type', 'email_sent')
        .gte('created_at', since.toISOString());

      if (error) throw error;

      // Calculate stats based on logs
      const total = data?.length || 0;
      let sent = 0, failed = 0, pending = 0;

      data?.forEach(log => {
        const logData = log.metadata as any;
        const status = logData?.status || 'sent';
        switch (status) {
          case 'sent':
          case 'delivered':
            sent++;
            break;
          case 'failed':
          case 'error':
            failed++;
            break;
          case 'pending':
          case 'processing':
            pending++;
            break;
        }
      });

      setStats({ total, sent, failed, pending });
    } catch (error: any) {
      console.error('Error loading email stats:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Mail className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      sent: 'default',
      delivered: 'default',
      failed: 'destructive',
      error: 'destructive',
      pending: 'secondary',
      processing: 'secondary'
    };
    
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status || 'enviado'}
      </Badge>
    );
  };

  const filteredLogs = logs.filter(log => 
    !searchTerm || 
    log.entity_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.metadata?.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Monitorização de Email
          </h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe o status e histórico de emails enviados
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Última hora</SelectItem>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => { loadEmailLogs(); loadEmailStats(); }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="logs">Logs Detalhados</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Enviados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Falharam</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.failed > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Alertas de Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700">
                  {stats.failed} emails falharam no período selecionado. 
                  Verifique a configuração SMTP e os logs detalhados.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar por email ou assunto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map(log => (
              <Card key={log.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(log.metadata?.status)}
                        <span className="font-medium">{log.entity_id}</span>
                        {getStatusBadge(log.metadata?.status)}
                      </div>
                      
                      {log.metadata?.subject && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Assunto:</strong> {log.metadata.subject}
                        </p>
                      )}
                      
                      {log.metadata?.template && (
                        <p className="text-sm text-muted-foreground mb-1">
                          <strong>Template:</strong> {log.metadata.template}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.ip_address && (
                          <span>IP: {log.ip_address}</span>
                        )}
                      </div>
                    </div>
                    
                    {log.metadata?.error && (
                      <div className="text-right">
                        <Badge variant="destructive">Erro</Badge>
                        <p className="text-xs text-red-600 mt-1 max-w-xs truncate">
                          {log.metadata.error}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {filteredLogs.length === 0 && !loading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm ? 'Nenhum log encontrado para a pesquisa.' : 'Nenhum log de email encontrado.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailLogsMonitor;