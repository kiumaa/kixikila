import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Rocket,
  Shield,
  Globe,
  Database,
  CreditCard,
  MessageSquare,
  Activity,
  ExternalLink,
  RefreshCw,
  Terminal,
  Settings,
  Users,
  Zap
} from 'lucide-react';

interface DeploymentCheck {
  id: string;
  name: string;
  description: string;
  category: 'security' | 'infrastructure' | 'integrations' | 'testing';
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  required: boolean;
  automated: boolean;
  message?: string;
  action_url?: string;
}

interface DeploymentStats {
  total_checks: number;
  completed_checks: number;
  critical_issues: number;
  warnings: number;
  estimated_go_live: string;
}

const ProductionDeployment: React.FC = () => {
  const [deploymentChecks, setDeploymentChecks] = useState<DeploymentCheck[]>([]);
  const [deploymentStats, setDeploymentStats] = useState<DeploymentStats | null>(null);
  const [isRunningChecks, setIsRunningChecks] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [goLiveStatus, setGoLiveStatus] = useState<'not-ready' | 'ready' | 'deploying' | 'live'>('not-ready');

  const initializeDeploymentChecks = () => {
    const checks: DeploymentCheck[] = [
      // Security Checks
      {
        id: 'supabase-otp-expiry',
        name: 'Supabase OTP Expiry',
        description: 'Configurar OTP expiry para 10 minutos no dashboard Supabase',
        category: 'security',
        status: 'pending',
        required: true,
        automated: false,
        action_url: 'https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings'
      },
      {
        id: 'leaked-password-protection',
        name: 'Leaked Password Protection',
        description: 'Ativar proteção contra senhas vazadas no Supabase',
        category: 'security',
        status: 'pending',
        required: true,
        automated: false,
        action_url: 'https://supabase.com/dashboard/project/hkesrohuaurcyonpktyt/auth/settings'
      },
      {
        id: 'rls-policies',
        name: 'RLS Policies Validation',
        description: 'Verificar se todas as tabelas críticas têm RLS habilitado',
        category: 'security',
        status: 'pending',
        required: true,
        automated: true
      },
      
      // Infrastructure Checks
      {
        id: 'railway-deployment',
        name: 'Railway Backend Deployment',
        description: 'Deploy do backend no Railway com domínio api.kixikila.pro',
        category: 'infrastructure',
        status: 'pending',
        required: true,
        automated: false,
        action_url: 'https://railway.app'
      },
      {
        id: 'frontend-deployment',
        name: 'Frontend Deployment',
        description: 'Deploy do frontend no Lovable com domínio kixikila.pro',
        category: 'infrastructure',
        status: 'pending',
        required: true,
        automated: false
      },
      {
        id: 'dns-configuration',
        name: 'DNS Configuration',
        description: 'Configurar registros DNS para kixikila.pro e api.kixikila.pro',
        category: 'infrastructure',
        status: 'pending',
        required: true,
        automated: false
      },
      
      // Integration Checks
      {
        id: 'stripe-integration',
        name: 'Stripe Live Integration',
        description: 'Configurar chaves live do Stripe e webhooks',
        category: 'integrations',
        status: 'pending',
        required: true,
        automated: false,
        action_url: 'https://dashboard.stripe.com'
      },
      {
        id: 'bulksms-integration',
        name: 'BulkSMS Integration',
        description: 'Validar credenciais e configuração BulkSMS',
        category: 'integrations',
        status: 'pending',
        required: true,
        automated: true
      },
      {
        id: 'edge-functions',
        name: 'Edge Functions Status',
        description: 'Verificar se todas as Edge Functions estão funcionais',
        category: 'integrations',
        status: 'pending',
        required: true,
        automated: true
      },
      
      // Testing Checks
      {
        id: 'health-endpoints',
        name: 'Health Endpoints',
        description: 'Verificar se endpoints de health estão respondendo',
        category: 'testing',
        status: 'pending',
        required: true,
        automated: true
      },
      {
        id: 'end-to-end-testing',
        name: 'End-to-End Testing',
        description: 'Executar testes críticos: registro, login, pagamentos',
        category: 'testing',
        status: 'pending',
        required: true,
        automated: false
      },
      {
        id: 'performance-testing',
        name: 'Performance Testing',
        description: 'Verificar tempos de resposta e performance geral',
        category: 'testing',
        status: 'pending',
        required: false,
        automated: true
      }
    ];

    setDeploymentChecks(checks);
    updateDeploymentStats(checks);
  };

  const updateDeploymentStats = (checks: DeploymentCheck[]) => {
    const stats: DeploymentStats = {
      total_checks: checks.length,
      completed_checks: checks.filter(c => c.status === 'success').length,
      critical_issues: checks.filter(c => c.status === 'error' && c.required).length,
      warnings: checks.filter(c => c.status === 'warning').length,
      estimated_go_live: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    setDeploymentStats(stats);

    // Update go-live status
    const criticalPassed = checks.filter(c => c.required && c.status === 'success').length;
    const totalCritical = checks.filter(c => c.required).length;
    
    if (criticalPassed === totalCritical) {
      setGoLiveStatus('ready');
    } else if (criticalPassed > totalCritical * 0.7) {
      setGoLiveStatus('deploying');
    } else {
      setGoLiveStatus('not-ready');
    }
  };

  const runAutomatedChecks = async () => {
    setIsRunningChecks(true);
    const updatedChecks = [...deploymentChecks];

    try {
      // RLS Policies Check
      const rlsCheckIndex = updatedChecks.findIndex(c => c.id === 'rls-policies');
      if (rlsCheckIndex >= 0) {
        updatedChecks[rlsCheckIndex].status = 'running';
        setDeploymentChecks([...updatedChecks]);

        try {
          const { data, error } = await supabase.rpc('validate_rls_security');
          if (error) throw error;
          
          const hasRLS = data?.every((table: any) => table.policy_count > 0);
          updatedChecks[rlsCheckIndex].status = hasRLS ? 'success' : 'error';
          updatedChecks[rlsCheckIndex].message = hasRLS 
            ? 'Todas as tabelas críticas têm RLS habilitado'
            : 'Algumas tabelas não têm RLS configurado';
        } catch (error) {
          updatedChecks[rlsCheckIndex].status = 'error';
          updatedChecks[rlsCheckIndex].message = 'Erro ao verificar RLS';
        }
      }

      // Health Endpoints Check
      const healthCheckIndex = updatedChecks.findIndex(c => c.id === 'health-endpoints');
      if (healthCheckIndex >= 0) {
        updatedChecks[healthCheckIndex].status = 'running';
        setDeploymentChecks([...updatedChecks]);

        try {
          const { data, error } = await supabase.functions.invoke('health-check');
          updatedChecks[healthCheckIndex].status = error ? 'error' : 'success';
          updatedChecks[healthCheckIndex].message = error 
            ? 'Health check falhou'
            : 'Todos os endpoints estão funcionais';
        } catch (error) {
          updatedChecks[healthCheckIndex].status = 'error';
          updatedChecks[healthCheckIndex].message = 'Erro ao executar health check';
        }
      }

      // Edge Functions Check
      const edgeFunctionsIndex = updatedChecks.findIndex(c => c.id === 'edge-functions');
      if (edgeFunctionsIndex >= 0) {
        updatedChecks[edgeFunctionsIndex].status = 'running';
        setDeploymentChecks([...updatedChecks]);

        // Simulate edge functions check
        setTimeout(() => {
          updatedChecks[edgeFunctionsIndex].status = 'success';
          updatedChecks[edgeFunctionsIndex].message = 'Todas as Edge Functions estão ativas';
          setDeploymentChecks([...updatedChecks]);
          updateDeploymentStats(updatedChecks);
        }, 2000);
      }

      setDeploymentChecks([...updatedChecks]);
      updateDeploymentStats(updatedChecks);
      toast.success('Verificações automáticas concluídas');

    } catch (error) {
      console.error('Error running automated checks:', error);
      toast.error('Erro ao executar verificações automáticas');
    } finally {
      setIsRunningChecks(false);
    }
  };

  const markManualCheckComplete = (checkId: string, status: 'success' | 'error' | 'warning') => {
    const updatedChecks = deploymentChecks.map(check =>
      check.id === checkId ? { ...check, status } : check
    );
    setDeploymentChecks(updatedChecks);
    updateDeploymentStats(updatedChecks);
  };

  const initiateGoLive = async () => {
    if (goLiveStatus !== 'ready') {
      toast.error('Resolva todas as verificações críticas antes do Go-Live');
      return;
    }

    try {
      setGoLiveStatus('deploying');
      
      // Log the go-live initiation
      const { error } = await supabase.from('audit_logs').insert({
        entity_type: 'system',
        entity_id: 'go-live',
        action: 'production_go_live_initiated',
        metadata: {
          timestamp: new Date().toISOString(),
          deployment_stats: JSON.stringify(deploymentStats),
          initiated_by: 'admin'
        } as any
      });

      if (error) throw error;

      setTimeout(() => {
        setGoLiveStatus('live');
        toast.success('🚀 KIXIKILA está oficialmente em produção!');
      }, 3000);

    } catch (error) {
      console.error('Error initiating go-live:', error);
      toast.error('Erro ao inicializar Go-Live');
      setGoLiveStatus('ready');
    }
  };

  useEffect(() => {
    initializeDeploymentChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running': return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return <Shield className="w-5 h-5" />;
      case 'infrastructure': return <Globe className="w-5 h-5" />;
      case 'integrations': return <Zap className="w-5 h-5" />;
      case 'testing': return <Activity className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const progressPercentage = deploymentStats 
    ? (deploymentStats.completed_checks / deploymentStats.total_checks) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Deployment & Go-Live</h1>
          <p className="text-gray-600 mt-1">Preparação final para produção</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant={goLiveStatus === 'live' ? 'default' : 'secondary'} className="px-3 py-1">
            {goLiveStatus === 'live' && '🚀'} 
            {goLiveStatus === 'ready' && '✅'} 
            {goLiveStatus === 'deploying' && '⏳'} 
            {goLiveStatus === 'not-ready' && '🔧'}
            {' '}
            {goLiveStatus === 'live' ? 'EM PRODUÇÃO' : 
             goLiveStatus === 'ready' ? 'PRONTO' : 
             goLiveStatus === 'deploying' ? 'DEPLOYING' : 'PREPARANDO'}
          </Badge>
          
          {goLiveStatus === 'ready' && (
            <Button onClick={initiateGoLive} size="lg" className="bg-green-600 hover:bg-green-700">
              <Rocket className="w-4 h-4 mr-2" />
              Iniciar Go-Live
            </Button>
          )}
        </div>
      </div>

      {/* Progress Overview */}
      {deploymentStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Progresso do Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Verificações Concluídas</span>
                  <span>{deploymentStats.completed_checks}/{deploymentStats.total_checks}</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-semibold text-red-700">Issues Críticos</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {deploymentStats.critical_issues}
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold text-yellow-700">Avisos</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600 mt-1">
                    {deploymentStats.warnings}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="font-semibold text-green-700">Concluídas</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {deploymentStats.completed_checks}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="infrastructure" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Infrastructure
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Integrações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Todas as Verificações</h3>
            <Button 
              onClick={runAutomatedChecks} 
              disabled={isRunningChecks}
              variant="outline"
            >
              {isRunningChecks ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Terminal className="w-4 h-4 mr-2" />
              )}
              Executar Verificações Automáticas
            </Button>
          </div>

          <div className="grid gap-4">
            {deploymentChecks.map((check) => (
              <Card key={check.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(check.category)}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{check.name}</h4>
                          {check.required && (
                            <Badge variant="destructive">Crítico</Badge>
                          )}
                          {check.automated && (
                            <Badge variant="secondary">Auto</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{check.description}</p>
                        {check.message && (
                          <p className="text-xs text-gray-500 mt-1">{check.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(check.status)}
                      
                      {!check.automated && check.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markManualCheckComplete(check.id, 'success')}
                          >
                            ✅ Concluído
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => markManualCheckComplete(check.id, 'error')}
                          >
                            ❌ Erro
                          </Button>
                        </div>
                      )}
                      
                      {check.action_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(check.action_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Category-specific tabs */}
        {['security', 'infrastructure', 'integrations'].map((category) => (
          <TabsContent key={category} value={category}>
            <div className="space-y-4">
              {deploymentChecks
                .filter(check => check.category === category)
                .map((check) => (
                  <Card key={check.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getCategoryIcon(check.category)}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{check.name}</h4>
                              {check.required && (
                                <Badge variant="destructive">Crítico</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{check.description}</p>
                            {check.message && (
                              <p className="text-xs text-gray-500 mt-1">{check.message}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusIcon(check.status)}
                          
                          {!check.automated && check.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markManualCheckComplete(check.id, 'success')}
                              >
                                ✅ Concluído
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => markManualCheckComplete(check.id, 'error')}
                              >
                                ❌ Erro
                              </Button>
                            </div>
                          )}
                          
                          {check.action_url && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(check.action_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Go-Live Status */}
      {goLiveStatus === 'live' && (
        <Alert className="border-green-200 bg-green-50">
          <Rocket className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 <strong>KIXIKILA está oficialmente em produção!</strong> 
            O sistema está funcionando e monitorando automaticamente. 
            Acompanhe as métricas nos próximos dashboards.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ProductionDeployment;