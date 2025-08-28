import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckResult {
  component: string;
  status: 'HEALTHY' | 'WARNING' | 'ERROR';
  details: string;
  last_check: string;
  response_time_ms?: number;
}

interface SystemStats {
  total_users: number;
  active_users: number;
  vip_users: number;
  pending_otps: number;
  unread_notifications: number;
}

interface SecurityAlert {
  alert_type: string;
  severity: 'high' | 'medium' | 'low';
  message: string;
  count: number;
  latest_occurrence: string;
}

interface MonitoringData {
  healthChecks: HealthCheckResult[];
  systemStats: SystemStats | null;
  securityAlerts: SecurityAlert[];
  lastUpdated: Date | null;
  isLoading: boolean;
  error: string | null;
}

export const useProductionMonitoring = (autoRefreshInterval?: number) => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData>({
    healthChecks: [],
    systemStats: null,
    securityAlerts: [],
    lastUpdated: null,
    isLoading: false,
    error: null
  });

  const { toast } = useToast();

  const performFullHealthCheck = useCallback(async () => {
    try {
      setMonitoringData(prev => ({ ...prev, isLoading: true, error: null }));

      console.log('🏥 Performing full health check...');

      const { data, error } = await supabase.functions.invoke('production-health', {
        body: { action: 'full_check' }
      });

      if (error) throw error;

      if (data.success) {
        setMonitoringData(prev => ({
          ...prev,
          healthChecks: data.data || [],
          lastUpdated: new Date(),
          isLoading: false,
          error: null
        }));

        console.log('✅ Health check completed:', data.summary);
      } else {
        throw new Error(data.error || 'Health check failed');
      }
    } catch (error: any) {
      console.error('❌ Health check failed:', error);
      setMonitoringData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      toast({
        title: 'Health Check Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const getSystemStats = useCallback(async () => {
    try {
      console.log('📊 Getting system statistics...');

      const { data, error } = await supabase.functions.invoke('production-health', {
        body: { action: 'system_stats' }
      });

      if (error) throw error;

      if (data.success) {
        setMonitoringData(prev => ({
          ...prev,
          systemStats: data.data,
          lastUpdated: new Date()
        }));

        console.log('📈 System stats retrieved:', data.data);
      } else {
        throw new Error(data.error || 'Failed to get system stats');
      }
    } catch (error: any) {
      console.error('❌ Failed to get system stats:', error);
      toast({
        title: 'Statistics Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const checkSecurityAlerts = useCallback(async () => {
    try {
      console.log('🔒 Checking security alerts...');

      const { data, error } = await supabase.functions.invoke('production-health', {
        body: { action: 'security_audit' }
      });

      if (error) throw error;

      if (data.success) {
        setMonitoringData(prev => ({
          ...prev,
          securityAlerts: data.data || [],
          lastUpdated: new Date()
        }));

        console.log('🛡️ Security audit completed:', data.summary);

        // Show toast for high-priority alerts
        const highPriorityAlerts = (data.data || []).filter((alert: SecurityAlert) => alert.severity === 'high');
        if (highPriorityAlerts.length > 0) {
          toast({
            title: 'High Priority Security Alert',
            description: `${highPriorityAlerts.length} high priority security alerts detected`,
            variant: 'destructive'
          });
        }
      } else {
        throw new Error(data.error || 'Security audit failed');
      }
    } catch (error: any) {
      console.error('❌ Security audit failed:', error);
      toast({
        title: 'Security Audit Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast]);

  const cleanupExpiredData = useCallback(async () => {
    try {
      console.log('🧹 Performing data cleanup...');

      const { data, error } = await supabase.functions.invoke('production-health', {
        body: { action: 'cleanup_expired' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'Cleanup Completed',
          description: 'Expired data has been successfully cleaned up',
          variant: 'default'
        });
        
        console.log('✅ Data cleanup completed');
        
        // Refresh stats after cleanup
        await getSystemStats();
      } else {
        throw new Error(data.error || 'Cleanup failed');
      }
    } catch (error: any) {
      console.error('❌ Data cleanup failed:', error);
      toast({
        title: 'Cleanup Failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [toast, getSystemStats]);

  const refreshAllData = useCallback(async () => {
    await Promise.all([
      performFullHealthCheck(),
      getSystemStats(),
      checkSecurityAlerts()
    ]);
  }, [performFullHealthCheck, getSystemStats, checkSecurityAlerts]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefreshInterval && autoRefreshInterval > 0) {
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing monitoring data...');
        refreshAllData();
      }, autoRefreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefreshInterval, refreshAllData]);

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  return {
    ...monitoringData,
    actions: {
      performFullHealthCheck,
      getSystemStats,
      checkSecurityAlerts,
      cleanupExpiredData,
      refreshAllData
    },
    summary: {
      totalChecks: monitoringData.healthChecks.length,
      healthyChecks: monitoringData.healthChecks.filter(c => c.status === 'HEALTHY').length,
      warningChecks: monitoringData.healthChecks.filter(c => c.status === 'WARNING').length,
      errorChecks: monitoringData.healthChecks.filter(c => c.status === 'ERROR').length,
      highPriorityAlerts: monitoringData.securityAlerts.filter(a => a.severity === 'high').length,
      systemHealth: monitoringData.healthChecks.length > 0 
        ? (monitoringData.healthChecks.filter(c => c.status === 'HEALTHY').length / monitoringData.healthChecks.length) * 100 
        : 0
    }
  };
};