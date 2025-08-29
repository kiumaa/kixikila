import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  Users,
  UserCheck,
  CreditCard,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  DollarSign,
  Target,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: Array<{ date: string; users: number; vipUsers: number }>;
  transactionStats: Array<{ date: string; count: number; amount: number }>;
  groupActivity: Array<{ date: string; created: number; completed: number }>;
  userEngagement: Array<{ metric: string; value: number; change: number }>;
  systemMetrics: {
    totalUsers: number;
    activeUsers: number;
    vipUsers: number;
    totalTransactions: number;
    totalVolume: number;
    avgGroupSize: number;
    completionRate: number;
  };
  performanceMetrics: {
    avgResponseTime: number;
    errorRate: number;
    uptime: number;
    throughput: number;
  };
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get system statistics
      const { data: stats } = await supabase.rpc('get_system_stats');
      const systemStats = stats?.[0] || {};

      // Mock data for visualization - in production, this would come from actual analytics
      const mockAnalytics: AnalyticsData = {
        userGrowth: generateDateRange(timeRange).map((date, i) => ({
          date,
          users: 100 + i * 15 + Math.random() * 20,
          vipUsers: 20 + i * 3 + Math.random() * 5
        })),
        transactionStats: generateDateRange(timeRange).map((date, i) => ({
          date,
          count: 50 + i * 8 + Math.random() * 15,
          amount: 5000 + i * 500 + Math.random() * 1000
        })),
        groupActivity: generateDateRange(timeRange).map((date, i) => ({
          date,
          created: 5 + Math.random() * 10,
          completed: 3 + Math.random() * 8
        })),
        userEngagement: [
          { metric: 'Daily Active Users', value: 234, change: 12 },
          { metric: 'Session Duration', value: 18, change: -3 },
          { metric: 'Page Views', value: 1840, change: 25 },
          { metric: 'Bounce Rate', value: 23, change: -8 }
        ],
        systemMetrics: {
          totalUsers: systemStats.total_users || 0,
          activeUsers: systemStats.active_users || 0,
          vipUsers: systemStats.vip_users || 0,
          totalTransactions: 1247,
          totalVolume: 125430.50,
          avgGroupSize: 6.8,
          completionRate: 87.3
        },
        performanceMetrics: {
          avgResponseTime: 245,
          errorRate: 0.023,
          uptime: 99.97,
          throughput: 1340
        }
      };

      setAnalytics(mockAnalytics);
    } catch (error: any) {
      toast({
        title: 'Analytics Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const generateDateRange = (range: string) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', {
      style: 'currency',
      currency: 'EUR'
    }).format(value);
  };

  const exportReport = () => {
    // Mock export functionality
    toast({
      title: 'Export Started',
      description: 'Analytics report will be downloaded shortly',
      variant: 'default'
    });
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse text-gray-400" />
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>

        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={loadAnalytics}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.systemMetrics.totalUsers.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  +{analytics.userEngagement[0].change}% vs last period
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Transaction Volume</p>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics.systemMetrics.totalVolume)}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  +15.3% vs last period
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.systemMetrics.completionRate.toFixed(1)}%
                </div>
                <Progress 
                  value={analytics.systemMetrics.completionRate} 
                  className="mt-2 h-2" 
                />
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <div className="text-2xl font-bold text-gray-900">
                  {analytics.performanceMetrics.uptime}%
                </div>
                <Badge variant="outline" className="mt-1 text-emerald-600 border-emerald-200">
                  Excellent
                </Badge>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="groups">Group Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trends</CardTitle>
              <CardDescription>Track user registration and VIP conversions over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="Total Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="vipUsers" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2} 
                    name="VIP Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Analytics</CardTitle>
              <CardDescription>Monitor transaction volume and frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.transactionStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar 
                    yAxisId="left"
                    dataKey="count" 
                    fill="hsl(var(--primary))" 
                    name="Transaction Count"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="amount" 
                    fill="hsl(var(--secondary))" 
                    name="Transaction Volume (€)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="groups" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Group Activity</CardTitle>
              <CardDescription>Track group creation and completion rates</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.groupActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2} 
                    name="Groups Created"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2} 
                    name="Groups Completed"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>Average API response time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {analytics.performanceMetrics.avgResponseTime}ms
                  </div>
                  <Progress value={75} className="w-full mb-2" />
                  <p className="text-sm text-gray-600">Target: &lt;500ms</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
                <CardDescription>System error percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {(analytics.performanceMetrics.errorRate * 100).toFixed(3)}%
                  </div>
                  <Progress value={analytics.performanceMetrics.errorRate * 100} className="w-full mb-2" />
                  <p className="text-sm text-gray-600">Target: &lt;1%</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* User Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>User Engagement Metrics</CardTitle>
          <CardDescription>Key performance indicators for user activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analytics.userEngagement.map((metric, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{metric.metric}</div>
                <div className="text-xl font-bold text-gray-900">{metric.value.toLocaleString()}</div>
                <div className={`text-sm mt-1 ${metric.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {metric.change >= 0 ? '+' : ''}{metric.change}% vs last period
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;