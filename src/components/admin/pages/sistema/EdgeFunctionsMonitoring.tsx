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
  Zap,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  TrendingUp,
  Database,
  Globe,
  Server,
  RefreshCw,
  Play,
  Pause,
  Eye,
  Download,
  Terminal,
  Code
} from 'lucide-react';

interface EdgeFunction {
  name: string;
  status: 'active' | 'inactive' | 'error';
  lastDeployment: string;
  executions: number;
  avgResponseTime: number;
  errorRate: number;
  memoryUsage: number;
  lastExecution: string;
  version: string;
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  function: string;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  memory: number;
  logs: string[];
  error?: string;
}

const EdgeFunctionsMonitoring: React.FC = () => {
  const [functions, setFunctions] = useState<EdgeFunction[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock edge functions data
  const initializeFunctions = () => {
    const mockFunctions: EdgeFunction[] = [
      {
        name: 'production-health',
        status: 'active',
        lastDeployment: '2024-08-29T10:30:00Z',
        executions: 1247,
        avgResponseTime: 234,
        errorRate: 0.012,
        memoryUsage: 45.2,
        lastExecution: '2024-08-29T14:22:00Z',
        version: '1.2.3'
      },
      {
        name: 'health-check',
        status: 'active',
        lastDeployment: '2024-08-28T16:45:00Z',
        executions: 567,
        avgResponseTime: 189,
        errorRate: 0.005,
        memoryUsage: 32.1,
        lastExecution: '2024-08-29T14:21:00Z',
        version: '1.1.0'
      },
      {
        name: 'send-otp-sms',
        status: 'active',
        lastDeployment: '2024-08-29T09:15:00Z',
        executions: 89,
        avgResponseTime: 456,
        errorRate: 0.023,
        memoryUsage: 28.7,
        lastExecution: '2024-08-29T13:45:00Z',
        version: '2.0.1'
      },
      {
        name: 'verify-otp',
        status: 'active',
        lastDeployment: '2024-08-29T08:20:00Z',
        executions: 76,
        avgResponseTime: 123,
        errorRate: 0.001,
        memoryUsage: 21.3,
        lastExecution: '2024-08-29T13:40:00Z',
        version: '1.5.2'
      },
      {
        name: 'send-group-invitation',
        status: 'error',
        lastDeployment: '2024-08-28T14:30:00Z',
        executions: 23,
        avgResponseTime: 892,
        errorRate: 0.087,
        memoryUsage: 67.4,
        lastExecution: '2024-08-29T12:10:00Z',
        version: '1.0.0'
      },
      {
        name: 'create-checkout',
        status: 'active',
        lastDeployment: '2024-08-29T11:45:00Z',
        executions: 145,
        avgResponseTime: 345,
        errorRate: 0.014,
        memoryUsage: 38.9,
        lastExecution: '2024-08-29T14:15:00Z',
        version: '1.3.0'
      }
    ];

    const mockLogs: ExecutionLog[] = [
      {
        id: '1',
        timestamp: '2024-08-29T14:22:00Z',
        function: 'production-health',
        duration: 234,
        status: 'success',
        memory: 45.2,
        logs: [
          '[PRODUCTION-HEALTH] Health check started',
          '[PRODUCTION-HEALTH] Performing full health check',
          '[PRODUCTION-HEALTH] Full health check completed - {"results":6}'
        ]
      },
      {
        id: '2',
        timestamp: '2024-08-29T14:21:00Z',
        function: 'health-check',
        duration: 189,
        status: 'success',
        memory: 32.1,
        logs: [
          'Health check completed: {"status":"healthy","timestamp":"2024-08-29T14:21:00Z"}'
        ]
      },
      {
        id: '3',
        timestamp: '2024-08-29T13:45:00Z',
        function: 'send-otp-sms',
        duration: 456,
        status: 'success',
        memory: 28.7,
        logs: [
          'SMS sending started for user: xxxxx',
          'BulkSMS API call successful',
          'SMS sent successfully'
        ]
      },
      {
        id: '4',
        timestamp: '2024-08-29T12:10:00Z',
        function: 'send-group-invitation',
        duration: 892,
        status: 'error',
        memory: 67.4,
        error: 'Failed to send invitation email: SMTP timeout',
        logs: [
          'Processing group invitation request',
          'Error: SMTP connection timeout after 30s',
          'Retry attempt 1 failed',
          'Retry attempt 2 failed'
        ]
      }
    ];

    setFunctions(mockFunctions);
    setExecutionLogs(mockLogs);
    if (mockFunctions.length > 0) {
      setSelectedFunction(mockFunctions[0].name);
    }
  };

  useEffect(() => {
    initializeFunctions();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to refresh data
      await new Promise(resolve => setTimeout(resolve, 1000));
      initializeFunctions();
      
      toast({
        title: 'Data Refreshed',
        description: 'Edge functions monitoring data has been updated',
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Refresh Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testFunction = async (functionName: string) => {
    try {
      toast({
        title: 'Testing Function',
        description: `Executing test for ${functionName}...`,
        variant: 'default'
      });

      // Simulate function execution
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });

      if (error) throw error;

      toast({
        title: 'Test Successful',
        description: `Function ${functionName} executed successfully`,
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Test Failed',
        description: `Function ${functionName} test failed: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'inactive':
        return <Pause className="w-4 h-4 text-amber-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'inactive':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExecutionStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'timeout':
        return <Clock className="w-4 h-4 text-amber-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const selectedFunctionData = functions.find(f => f.name === selectedFunction);
  const selectedFunctionLogs = executionLogs.filter(log => log.function === selectedFunction);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edge Functions Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor and analyze edge function performance</p>
        </div>

        <Button
          onClick={refreshData}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Functions</p>
                <div className="text-2xl font-bold text-gray-900">{functions.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Functions</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {functions.filter(f => f.status === 'active').length}
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Executions</p>
                <div className="text-2xl font-bold text-gray-900">
                  {functions.reduce((sum, f) => sum + f.executions, 0).toLocaleString()}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(functions.reduce((sum, f) => sum + f.avgResponseTime, 0) / functions.length)}ms
                </div>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Functions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Edge Functions Overview
          </CardTitle>
          <CardDescription>
            Status and performance metrics for all edge functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {functions.map((func) => (
              <div 
                key={func.name} 
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                  selectedFunction === func.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedFunction(func.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(func.status)}
                    <div>
                      <div className="font-semibold text-gray-900">{func.name}</div>
                      <div className="text-sm text-gray-600">Version {func.version}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Executions</div>
                      <div className="font-semibold">{func.executions.toLocaleString()}</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Response Time</div>
                      <div className="font-semibold">{func.avgResponseTime}ms</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Error Rate</div>
                      <div className="font-semibold">{(func.errorRate * 100).toFixed(2)}%</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Memory</div>
                      <div className="font-semibold">{func.memoryUsage.toFixed(1)}%</div>
                    </div>
                    
                    <Badge className={getStatusColor(func.status)}>
                      {func.status.toUpperCase()}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        testFunction(func.name);
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Function Details */}
      {selectedFunctionData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="w-5 h-5" />
                Function Details: {selectedFunction}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Status</div>
                    <Badge className={getStatusColor(selectedFunctionData.status)}>
                      {selectedFunctionData.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Version</div>
                    <div className="font-semibold">{selectedFunctionData.version}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Last Deployment</div>
                    <div className="font-semibold">
                      {new Date(selectedFunctionData.lastDeployment).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Last Execution</div>
                    <div className="font-semibold">
                      {new Date(selectedFunctionData.lastExecution).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-600 mb-2">Memory Usage</div>
                  <Progress value={selectedFunctionData.memoryUsage} className="h-3" />
                  <div className="text-xs text-gray-500 mt-1">
                    {selectedFunctionData.memoryUsage.toFixed(1)}% of allocated memory
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="w-5 h-5" />
                Recent Executions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {selectedFunctionLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getExecutionStatusIcon(log.status)}
                        <span className="font-medium">{log.status.toUpperCase()}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Duration: {log.duration}ms • Memory: {log.memory.toFixed(1)}%
                    </div>
                    
                    {log.error && (
                      <Alert className="mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {log.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="bg-gray-900 rounded p-2 text-xs font-mono text-green-400 max-h-24 overflow-y-auto">
                      {log.logs.map((logLine, index) => (
                        <div key={index}>{logLine}</div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {selectedFunctionLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Terminal className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No execution logs available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EdgeFunctionsMonitoring;