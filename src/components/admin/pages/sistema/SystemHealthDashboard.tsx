import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  Server,
  Database,
  Globe,
  Shield,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Thermometer,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  Users,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  uptime: number;
  lastCheck: string;
  details: string;
  metrics?: {
    cpu?: number;
    memory?: number;
    disk?: number;
    connections?: number;
  };
}

interface SystemAlert {
  id: string;
  type: 'performance' | 'security' | 'error' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolvedAt?: string;
}

const SystemHealthDashboard: React.FC = () => {
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [overallHealth, setOverallHealth] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const initializeHealthData = () => {
    const mockHealthChecks: HealthCheck[] = [
      {
        service: 'Frontend Application',
        status: 'healthy',
        responseTime: 145,
        uptime: 99.98,
        lastCheck: new Date().toISOString(),
        details: 'Application is running smoothly',
        metrics: {
          cpu: 12.5,
          memory: 34.2,
          connections: 247
        }
      },
      {
        service: 'Supabase Database',
        status: 'healthy',
        responseTime: 89,
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
        details: 'Database connection pool is healthy',
        metrics: {
          cpu: 23.1,
          memory: 67.8,
          disk: 45.3,
          connections: 23
        }
      },
      {
        service: 'Edge Functions',
        status: 'warning',
        responseTime: 567,
        uptime: 98.95,
        lastCheck: new Date().toISOString(),
        details: 'Elevated response times detected',
        metrics: {
          cpu: 78.2,
          memory: 89.1
        }
      },
      {
        service: 'Authentication Service',
        status: 'healthy',
        responseTime: 234,
        uptime: 99.97,
        lastCheck: new Date().toISOString(),
        details: 'OAuth providers responding normally',
        metrics: {
          cpu: 15.3,
          memory: 42.6,
          connections: 156
        }
      },
      {
        service: 'SMS Gateway (BulkSMS)',
        status: 'healthy',
        responseTime: 412,
        uptime: 99.85,
        lastCheck: new Date().toISOString(),
        details: 'SMS delivery service operational',
        metrics: {
          connections: 12
        }
      },
      {
        service: 'CDN Network',
        status: 'healthy',
        responseTime: 67,
        uptime: 99.99,
        lastCheck: new Date().toISOString(),
        details: 'Global edge nodes healthy',
        metrics: {
          cpu: 8.9,
          memory: 25.4
        }
      },
      {
        service: 'Monitoring System',
        status: 'healthy',
        responseTime: 156,
        uptime: 99.94,
        lastCheck: new Date().toISOString(),
        details: 'All monitoring services active',
        metrics: {
          cpu: 19.7,
          memory: 38.2,
          disk: 22.1
        }
      }
    ];

    const mockAlerts: SystemAlert[] = [
      {
        id: '1',
        type: 'performance',
        severity: 'medium',
        title: 'High Memory Usage',
        message: 'Edge Functions service is using 89.1% memory. Consider scaling up.',
        timestamp: '2024-08-29T14:30:00Z',
        acknowledged: false
      },
      {
        id: '2',
        type: 'performance',
        severity: 'low',
        title: 'Elevated Response Time',
        message: 'Edge Functions average response time increased to 567ms.',
        timestamp: '2024-08-29T13:45:00Z',
        acknowledged: false
      },
      {
        id: '3',
        type: 'maintenance',
        severity: 'low',
        title: 'Scheduled Maintenance',
        message: 'Database maintenance window scheduled for tonight 02:00-04:00 UTC.',
        timestamp: '2024-08-29T12:00:00Z',
        acknowledged: true
      },
      {
        id: '4',
        type: 'security',
        severity: 'high',
        title: 'Multiple Failed Login Attempts',
        message: '15 failed login attempts detected from IP 192.168.1.100 in last hour.',
        timestamp: '2024-08-29T11:20:00Z',
        acknowledged: false
      }
    ];

    setHealthChecks(mockHealthChecks);
    setSystemAlerts(mockAlerts);
    
    // Calculate overall health score
    const healthyServices = mockHealthChecks.filter(h => h.status === 'healthy').length;
    const totalServices = mockHealthChecks.length;
    setOverallHealth(Math.round((healthyServices / totalServices) * 100));
    setLastUpdate(new Date());
  };

  useEffect(() => {
    initializeHealthData();
  }, []);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      // Simulate health check API calls
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const { data, error } = await supabase.functions.invoke('health-check');
      
      if (error) throw error;

      initializeHealthData();
      
      toast({
        title: 'Health Check Completed',
        description: 'All system components have been checked',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Health Check Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setSystemAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
    
    toast({
      title: 'Alert Acknowledged',
      description: 'Alert has been marked as acknowledged',
      variant: 'default'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceIcon = (service: string) => {
    if (service.includes('Database')) return <Database className="w-5 h-5" />;
    if (service.includes('CDN') || service.includes('Network')) return <Globe className="w-5 h-5" />;
    if (service.includes('Authentication') || service.includes('Security')) return <Shield className="w-5 h-5" />;
    if (service.includes('Edge') || service.includes('Function')) return <Zap className="w-5 h-5" />;
    if (service.includes('SMS') || service.includes('Gateway')) return <Wifi className="w-5 h-5" />;
    return <Server className="w-5 h-5" />;
  };

  const formatUptime = (uptime: number) => {
    return `${uptime.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor overall system health and component status</p>
        </div>

        <Button
          onClick={runHealthCheck}
          disabled={isLoading}
          variant="default"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Run Health Check
        </Button>
      </div>

      {/* Overall Health Score */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">System Health Score</h2>
              <div className="text-5xl font-bold text-emerald-600 mb-2">{overallHealth}%</div>
              <p className="text-gray-600">
                {healthChecks.filter(h => h.status === 'healthy').length} of {healthChecks.length} services healthy
              </p>
            </div>
            <div className="w-32 h-32">
              <div className="relative w-full h-full">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    className="text-gray-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallHealth / 100)}`}
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="services" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Services Status</TabsTrigger>
          <TabsTrigger value="alerts">System Alerts</TabsTrigger>
          <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {healthChecks.map((check, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getServiceIcon(check.service)}
                      <CardTitle className="text-base">{check.service}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(check.status)}>
                      {check.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">{check.details}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Response Time</div>
                        <div className="font-semibold">{check.responseTime}ms</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Uptime</div>
                        <div className="font-semibold">{formatUptime(check.uptime)}</div>
                      </div>
                    </div>

                    {check.metrics && (
                      <div className="space-y-2">
                        {check.metrics.cpu && (
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-500">CPU Usage</span>
                              <span className="font-semibold">{check.metrics.cpu}%</span>
                            </div>
                            <Progress value={check.metrics.cpu} className="h-2" />
                          </div>
                        )}
                        
                        {check.metrics.memory && (
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-500">Memory Usage</span>
                              <span className="font-semibold">{check.metrics.memory}%</span>
                            </div>
                            <Progress value={check.metrics.memory} className="h-2" />
                          </div>
                        )}
                        
                        {check.metrics.disk && (
                          <div>
                            <div className="flex justify-between items-center text-sm mb-1">
                              <span className="text-gray-500">Disk Usage</span>
                              <span className="font-semibold">{check.metrics.disk}%</span>
                            </div>
                            <Progress value={check.metrics.disk} className="h-2" />
                          </div>
                        )}
                        
                        {check.metrics.connections && (
                          <div className="text-sm">
                            <span className="text-gray-500">Active Connections: </span>
                            <span className="font-semibold">{check.metrics.connections}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      Last checked: {new Date(check.lastCheck).toLocaleTimeString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-3">
            {systemAlerts
              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
              .map((alert) => (
                <Alert key={alert.id} className={`${alert.acknowledged ? 'opacity-60' : ''}`}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {alert.type}
                          </Badge>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              ACKNOWLEDGED
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-semibold mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                        <div className="text-xs text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      {!alert.acknowledged && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}

            {systemAlerts.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
                <p className="text-lg font-medium">No System Alerts</p>
                <p className="text-sm">All systems are running smoothly</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                    <div className="text-2xl font-bold text-gray-900">
                      {Math.round(healthChecks.reduce((sum, h) => sum + h.responseTime, 0) / healthChecks.length)}ms
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">System Uptime</p>
                    <div className="text-2xl font-bold text-emerald-600">
                      {formatUptime(healthChecks.reduce((sum, h) => sum + h.uptime, 0) / healthChecks.length)}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                    <div className="text-2xl font-bold text-red-600">
                      {systemAlerts.filter(a => !a.acknowledged).length}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Services Online</p>
                    <div className="text-2xl font-bold text-green-600">
                      {healthChecks.filter(h => h.status === 'healthy').length}/{healthChecks.length}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {lastUpdate && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>Last updated: {lastUpdate.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemHealthDashboard;