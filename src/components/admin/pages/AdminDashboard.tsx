import React from 'react';
import { useAdminStore } from '@/store/useAdminStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  Euro, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { formatCurrency, formatDateTime } from '@/lib/utils';

// Mock chart data
const monthlyData = [
  { month: 'Jan', users: 45, revenue: 450, groups: 12 },
  { month: 'Fev', users: 52, revenue: 520, groups: 15 },
  { month: 'Mar', users: 78, revenue: 780, groups: 22 },
  { month: 'Abr', users: 125, revenue: 1250, groups: 35 },
  { month: 'Mai', users: 189, revenue: 1890, groups: 48 },
  { month: 'Jun', users: 234, revenue: 2340, groups: 62 }
];

const planDistribution = [
  { name: 'Free', value: 65, color: '#6b7280' },
  { name: 'VIP', value: 35, color: '#6366f1' }
];

const activityData = [
  { hour: '00:00', users: 12 },
  { hour: '04:00', users: 8 },
  { hour: '08:00', users: 45 },
  { hour: '12:00', users: 78 },
  { hour: '16:00', users: 65 },
  { hour: '20:00', users: 92 },
  { hour: '23:59', users: 34 }
];

const AdminDashboard: React.FC = () => {
  const { adminStats, activityLogs } = useAdminStore();

  const recentLogs = activityLogs.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Administrativo</h1>
        <p className="text-indigo-100">
          Bem-vindo ao painel de controlo da plataforma KIXIKILA
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total de Utilizadores
            </CardTitle>
            <Users className="w-5 h-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {adminStats.totalUsers}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">
                +{adminStats.monthlyGrowth}%
              </span>
              <span className="text-gray-500 ml-1">este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Grupos Ativos
            </CardTitle>
            <FileText className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {adminStats.totalGroups}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <Activity className="w-4 h-4 text-blue-500 mr-1" />
              <span className="text-gray-600">
                {Math.round(adminStats.totalGroups * 0.8)} ativos
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Receita Total
            </CardTitle>
            <Euro className="w-5 h-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(adminStats.totalRevenue)}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">
                +{formatCurrency(adminStats.totalRevenue * 0.15)}
              </span>
              <span className="text-gray-500 ml-1">este mês</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Utilizadores VIP
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {adminStats.vipUsers}
            </div>
            <div className="flex items-center mt-2 text-sm">
              <span className="text-gray-600">
                {Math.round((adminStats.vipUsers / adminStats.totalUsers) * 100)}% do total
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section - Improved desktop grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
        {/* Monthly Growth */}
        <Card className="2xl:col-span-2">{/* Take 2 columns on large screens */}
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'revenue' ? formatCurrency(value as number) : value,
                    name === 'users' ? 'Utilizadores' : 
                    name === 'revenue' ? 'Receita' : 'Grupos'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1"
                  stroke="#6366f1" 
                  fill="#6366f1" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="groups" 
                  stackId="1"
                  stroke="#8b5cf6" 
                  fill="#8b5cf6" 
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Planos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity and Recent Actions - Improved desktop layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* User Activity */}
        <Card className="xl:col-span-3">{/* Take 3 columns for charts */}
          <CardHeader>
            <CardTitle>Atividade de Utilizadores (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Utilizadores Ativos']}
                />
                <Bar dataKey="users" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Activity Logs */}
        <Card className="xl:col-span-2">{/* Take 2 columns for logs */}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {log.action}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {log.details}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(log.timestamp)}</span>
                    <span>• {log.adminName}</span>
                  </div>
                </div>
              </div>
            ))}

            {recentLogs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma atividade recente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Sistema Operacional</p>
                <p className="text-xs text-green-700">Todos os serviços funcionais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Manutenção Agendada</p>
                <p className="text-xs text-yellow-700">Domingo, 02:00 - 04:00</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Performance</p>
                <p className="text-xs text-blue-700">Tempo de resposta: 0.8s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;