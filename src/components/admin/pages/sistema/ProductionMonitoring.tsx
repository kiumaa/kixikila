import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProductionMonitoring } from '@/hooks/useProductionMonitoring';
import { 
  Activity, 
  Shield, 
  Database, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Trash2,
  Clock,
  TrendingUp,
  Server,
  Zap
} from 'lucide-react';

const ProductionMonitoring: React.FC = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const {
    healthChecks,
    systemStats,
    securityAlerts,
    lastUpdated,
    isLoading,
    error,
    actions,
    summary
  } = useProductionMonitoring(autoRefresh ? refreshInterval : undefined);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-500';
      case 'WARNING':
        return 'bg-amber-500';
      case 'ERROR':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case 'ERROR':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, any> = {
      high: 'destructive',
      medium: 'secondary',
      low: 'outline'
    };
    
    return <Badge variant={variants[severity] || 'outline'}>{severity.toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Production Monitoring</h1>
          <p className="text-gray-600 mt-1">Monitor system health, performance, and security</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="text-sm">
              Auto-refresh ({refreshInterval / 1000}s)
            </Label>
          </div>
          
          <Button
            onClick={actions.refreshAllData}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="font-medium">Monitoring Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.systemHealth.toFixed(0)}%
                </div>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Health Checks</p>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.healthyChecks}/{summary.totalChecks}
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
                <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                <div className="text-2xl font-bold text-gray-900">
                  {summary.highPriorityAlerts}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <div className="text-2xl font-bold text-gray-900">
                  {systemStats?.active_users || 0}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Checks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Health Checks
            </CardTitle>
            <CardDescription>
              Real-time status of critical system components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium text-gray-900">{check.component}</div>
                      <div className="text-sm text-gray-600">{check.details}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {check.response_time_ms && (
                      <span className="text-xs text-gray-500">{check.response_time_ms}ms</span>
                    )}
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(check.status)}`} />
                  </div>
                </div>
              ))}

              {healthChecks.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No health check data available</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={actions.performFullHealthCheck}
                    className="mt-2"
                  >
                    Run Health Check
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              System Statistics
            </CardTitle>
            <CardDescription>
              Key performance metrics and usage data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {systemStats ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Total Users</div>
                    <div className="text-xl font-bold text-gray-900">{systemStats.total_users}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">VIP Users</div>
                    <div className="text-xl font-bold text-amber-600">{systemStats.vip_users}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Pending OTPs</div>
                    <div className="text-xl font-bold text-blue-600">{systemStats.pending_otps}</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm text-gray-600">Unread Notifications</div>
                    <div className="text-xl font-bold text-purple-600">{systemStats.unread_notifications}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No statistics data available</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={actions.getSystemStats}
                  className="mt-2"
                >
                  Load Statistics
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Alerts */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Alerts
              </CardTitle>
              <CardDescription>
                Active security threats and anomalies
              </CardDescription>
            </div>
            <Button
              onClick={actions.checkSecurityAlerts}
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <Shield className="w-4 h-4 mr-2" />
              Run Audit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {securityAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{alert.message}</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {alert.count} occurrences • Last: {new Date(alert.latest_occurrence).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}

            {securityAlerts.length === 0 && !isLoading && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No security alerts detected</p>
                <p className="text-sm">System security is nominal</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            System Maintenance
          </CardTitle>
          <CardDescription>
            Perform maintenance tasks and system cleanup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={actions.cleanupExpiredData}
              disabled={isLoading}
              variant="outline"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup Expired Data
            </Button>
            
            <Button
              onClick={actions.performFullHealthCheck}
              disabled={isLoading}
              variant="outline"
            >
              <Database className="w-4 h-4 mr-2" />
              Database Health Check
            </Button>
          </div>

          {lastUpdated && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Last updated: {lastUpdated.toLocaleString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionMonitoring;