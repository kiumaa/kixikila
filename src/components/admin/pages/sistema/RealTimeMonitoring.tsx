import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  Server,
  Wifi,
  Cpu,
  HardDrive,
  Globe,
  Zap,
  Bell,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface SystemStatus {
  component: string;
  status: 'online' | 'warning' | 'offline';
  responseTime: number;
  lastCheck: string;
  details?: string;
}

interface LiveMetric {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  threshold: number;
}

interface RealtimeEvent {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  component: string;
  severity: 'low' | 'medium' | 'high';
}

const RealTimeMonitoring: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const { toast } = useToast();

  // Mock real-time monitoring data
  const initializeMonitoring = () => {
    const initialStatus: SystemStatus[] = [
      {
        component: 'Frontend App',
        status: 'online',
        responseTime: 145,
        lastCheck: new Date().toISOString(),
        details: 'All systems operational'
      },
      {
        component: 'Supabase Database',
        status: 'online', 
        responseTime: 89,
        lastCheck: new Date().toISOString(),
        details: 'Connection pool healthy'
      },
      {
        component: 'Edge Functions',
        status: 'warning',
        responseTime: 567,
        lastCheck: new Date().toISOString(),
        details: 'Elevated response times detected'
      },
      {
        component: 'Authentication Service',
        status: 'online',
        responseTime: 234,
        lastCheck: new Date().toISOString(),
        details: 'OAuth providers responding'
      },
      {
        component: 'SMS Gateway',
        status: 'online',
        responseTime: 412,
        lastCheck: new Date().toISOString(),
        details: 'BulkSMS API operational'
      },
      {
        component: 'CDN Network',
        status: 'online',
        responseTime: 67,
        lastCheck: new Date().toISOString(),
        details: 'Global edge nodes healthy'
      }
    ];

    const initialMetrics: LiveMetric[] = [
      {
        name: 'Active Users',
        value: 234,
        unit: 'users',
        status: 'normal',
        trend: 'up',
        threshold: 500
      },
      {
        name: 'Requests/Min',
        value: 1247,
        unit: 'req/min',
        status: 'normal',
        trend: 'stable',
        threshold: 2000
      },
      {
        name: 'Error Rate',
        value: 0.023,
        unit: '%',
        status: 'normal',
        trend: 'down',
        threshold: 1.0
      },
      {
        name: 'Memory Usage',
        value: 67.8,
        unit: '%',
        status: 'warning',
        trend: 'up',
        threshold: 80
      },
      {
        name: 'Database Pool',
        value: 23,
        unit: 'connections',
        status: 'normal',
        trend: 'stable',
        threshold: 100
      },
      {
        name: 'Queue Size',
        value: 12,
        unit: 'jobs',
        status: 'normal',
        trend: 'down',
        threshold: 100
      }
    ];

    setSystemStatus(initialStatus);
    setLiveMetrics(initialMetrics);
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      // Update metrics with random variations
      setLiveMetrics(prevMetrics => 
        prevMetrics.map(metric => ({
          ...metric,
          value: Math.max(0, metric.value + (Math.random() - 0.5) * metric.value * 0.1),
          trend: Math.random() > 0.6 ? (Math.random() > 0.5 ? 'up' : 'down') : 'stable'
        }))
      );

      // Add random events
      if (Math.random() > 0.7) {
        const eventTypes = ['info', 'warning', 'error', 'success'] as const;
        const components = ['API', 'Database', 'Auth', 'SMS', 'CDN'];
        const messages = [
          'Health check completed successfully',
          'New user registration spike detected',
          'Database query optimization applied',
          'Edge function deployment completed',
          'High memory usage detected',
          'Rate limit threshold approached',
          'System backup completed'
        ];

        const newEvent: RealtimeEvent = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          component: components[Math.floor(Math.random() * components.length)],
          severity: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low'
        };

        setRealtimeEvents(prev => [newEvent, ...prev.slice(0, 19)]);

        if (alertsEnabled && newEvent.type === 'error') {
          toast({
            title: 'System Alert',
            description: `${newEvent.component}: ${newEvent.message}`,
            variant: 'destructive'
          });
        }
      }

      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [isMonitoring, alertsEnabled, toast]);

  const toggleMonitoring = () => {
    if (!isMonitoring) {
      initializeMonitoring();
      toast({
        title: 'Real-time Monitoring Started',
        description: 'System monitoring is now active',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Real-time Monitoring Stopped',
        description: 'System monitoring has been paused',
        variant: 'default'
      });
    }
    setIsMonitoring(!isMonitoring);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'offline':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'offline':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'normal':
        return 'text-emerald-600';
      case 'warning':
        return 'text-amber-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-time Monitoring</h1>
          <p className="text-gray-600 mt-1">Live system status and performance monitoring</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="alerts"
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
              disabled={!isMonitoring}
            />
            <Label htmlFor="alerts" className="text-sm">
              <Bell className="w-4 h-4 inline mr-1" />
              Alerts
            </Label>
          </div>

          <Button
            onClick={toggleMonitoring}
            variant={isMonitoring ? "destructive" : "default"}
            className="min-w-32"
          >
            {isMonitoring ? (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {isMonitoring ? 'MONITORING' : 'OFFLINE'}
                </div>
              </div>
              <div className={`w-12 h-12 ${isMonitoring ? 'bg-emerald-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                <Activity className={`w-6 h-6 ${isMonitoring ? 'text-emerald-600 animate-pulse' : 'text-gray-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Services Online</p>
                <div className="text-2xl font-bold text-gray-900">
                  {systemStatus.filter(s => s.status === 'online').length}/{systemStatus.length}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <div className="text-sm font-medium text-gray-900">
                  {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Not monitoring'}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              System Components
            </CardTitle>
            <CardDescription>
              Real-time status of all system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((component, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(component.status)}
                    <div>
                      <div className="font-medium text-gray-900">{component.component}</div>
                      <div className="text-sm text-gray-600">{component.details}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(component.status)}>
                      {component.status.toUpperCase()}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {component.responseTime}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Live Metrics
            </CardTitle>
            <CardDescription>
              Real-time performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{metric.name}</span>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <Progress 
                      value={(metric.value / metric.threshold) * 100} 
                      className="h-2" 
                    />
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-lg font-bold ${getMetricColor(metric.status)}`}>
                      {metric.name === 'Error Rate' ? metric.value.toFixed(3) : Math.round(metric.value)}
                      <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Real-time Events
              </CardTitle>
              <CardDescription>
                Live system events and notifications
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRealtimeEvents([])}
              disabled={!isMonitoring}
            >
              Clear Events
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {realtimeEvents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No events to display</p>
                {!isMonitoring && (
                  <p className="text-sm">Start monitoring to see real-time events</p>
                )}
              </div>
            ) : (
              realtimeEvents.map((event) => (
                <Alert key={event.id} className={`
                  ${event.type === 'error' ? 'border-red-200 bg-red-50' : 
                    event.type === 'warning' ? 'border-amber-200 bg-amber-50' :
                    event.type === 'success' ? 'border-emerald-200 bg-emerald-50' :
                    'border-blue-200 bg-blue-50'}
                `}>
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {event.component}
                          </Badge>
                          <Badge 
                            variant={event.severity === 'high' ? 'destructive' : 
                                   event.severity === 'medium' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{event.message}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeMonitoring;