import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Calendar, Crown, Users, TrendingUp, MoreVertical, Trash2, CheckCircle, Filter, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useUserData';
import { formatDate } from '@/lib/mockData';
interface NotificationsScreenProps {
  onBack: () => void;
}
export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({
  onBack
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const {
    notifications,
    isLoading,
    error,
    markAsRead
  } = useNotifications();

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    if (showUnreadOnly && notification.read) return false;
    if (filterCategory !== 'all' && notification.type !== filterCategory) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Calendar className="w-5 h-5 text-primary" />;
      case 'group':
        return <Users className="w-5 h-5 text-info" />;
      case 'security':
        return <Crown className="w-5 h-5 text-warning" />;
      case 'system':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'reminder':
        return <Bell className="w-5 h-5 text-muted" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success text-success-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'error':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
  };

  const handleUnreadToggle = () => {
    setShowUnreadOnly(!showUnreadOnly);
  };

  const markAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter(n => !n.read)
          .map(n => markAsRead(n.id))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };
  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              onClick={onBack} 
              variant="ghost" 
              size="sm" 
              className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-system text-primary-foreground">
                Notificações
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-primary-foreground/80">
                  {unreadCount} não lidas
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                variant="ghost"
                size="sm"
                className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
              >
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => handleFilterChange('all')}>
                  Todas as categorias
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('payment')}>
                  Pagamentos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('group')}>
                  Grupos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('security')}>
                  Segurança
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleFilterChange('system')}>
                  Sistema
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleUnreadToggle}>
                  {showUnreadOnly ? 'Mostrar todas' : 'Apenas não lidas'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && notifications.length === 0 && (
        <div className="px-6 py-8 text-center">
          <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">A carregar notificações...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="px-6 py-8 text-center">
          <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Erro ao carregar notificações</p>
        </div>
      )}

      {/* Notifications List */}
      <div className="px-6 space-y-3 my-4">
        {filteredNotifications.length > 0 ? (
          <>
            {filteredNotifications.map(notification => (
              <Card 
                key={notification.id} 
                className={`ios-card cursor-pointer transition-all ${
                  !notification.read ? 'ring-2 ring-primary/20 bg-primary/5' : ''
                }`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm font-medium font-system ${
                            !notification.read ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(notification.created_at)}
                            </p>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getNotificationTypeColor(notification.type)}`}
                            >
                              {notification.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        ) : !isLoading && !error ? (
          <Card className="ios-card">
            <CardContent className="p-8 text-center space-y-4">
              <Bell className="w-12 h-12 text-muted mx-auto" />
              <div>
                <p className="text-muted-foreground font-medium">
                  {showUnreadOnly ? 'Sem notificações não lidas' : 'Sem notificações'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {showUnreadOnly 
                    ? 'Todas as suas notificações foram lidas'
                    : 'As suas notificações aparecerão aqui'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
};