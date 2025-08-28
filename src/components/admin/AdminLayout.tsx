import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/store/useAdminStore';
import { useDarkMode } from '@/hooks/use-dark-mode';
import {
  BarChart3,
  Users,
  FileText,
  CreditCard,
  Palette,
  Smartphone,
  Bell,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Clock,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar } from '@/components/design-system/Avatar';
import { cn } from '@/lib/utils';
import kixikilaLogoDark from '@/assets/kixikila-logo-dark.png';
import kixikilaLogoLight from '@/assets/kixikila-logo-light.png';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const sidebarItems = [
  { icon: BarChart3, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Users, label: 'Utilizadores', path: '/admin/users' },
  { icon: FileText, label: 'Grupos', path: '/admin/groups' },
  { icon: Shield, label: 'Segurança', path: '/admin/security' },
  { icon: Activity, label: 'Logs', path: '/admin/logs' },
  { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  { icon: Settings, label: 'Config. Avançadas', path: '/admin/advanced-settings' }
];

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentAdmin, adminLogout, sessionTimeout, extendSession } = useAdminStore();
  const { isDark } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Session timeout management
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, sessionTimeout - Date.now());
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        adminLogout();
        navigate('/admin');
      } else if (remaining < 60000) { // Less than 1 minute
        // Could show warning here
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionTimeout, adminLogout, navigate]);

  // Extend session on user activity
  useEffect(() => {
    const handleActivity = () => extendSession();
    
    window.addEventListener('mousedown', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);
    
    return () => {
      window.removeEventListener('mousedown', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, [extendSession]);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin');
  };

  const formatTimeRemaining = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:flex lg:flex-col lg:w-80 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <img 
              src={isDark ? kixikilaLogoDark : kixikilaLogoLight} 
              alt="KIXIKILA" 
              className="h-10 w-auto" 
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors",
                  isActivePath(item.path)
                    ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Session Info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <Avatar 
                name={currentAdmin?.avatar || 'AD'} 
                size="sm"
                verified={true}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {currentAdmin?.name}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {currentAdmin?.role}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Clock className="w-4 h-4" />
              <span>Sessão: {formatTimeRemaining(timeRemaining)}</span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Terminar Sessão
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-white">
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2">
              {sidebarItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm font-medium rounded-lg transition-colors",
                    isActivePath(item.path)
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:pl-80">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {sidebarItems.find(item => isActivePath(item.path))?.label || 'Admin Panel'}
                </h2>
                <p className="text-sm text-gray-500">
                  Gestão da plataforma KIXIKILA
                </p>
              </div>
            </div>

            {/* Session warning for mobile */}
            <div className="lg:hidden">
              {timeRemaining < 60000 && (
                <Card className="p-2 bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 text-xs text-yellow-700">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimeRemaining(timeRemaining)}</span>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;