import React, { useState } from 'react';
import { ArrowLeft, Bell, Users, CreditCard, Gift, CheckCircle2, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/design-system/Avatar';
import { formatDateTime } from '@/lib/utils';
import { getNotifications } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState(getNotifications());
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-5 h-5 text-blue-500" />;
      case 'winner':
        return <Gift className="w-5 h-5 text-purple-500" />;
      case 'member':
        return <Users className="w-5 h-5 text-green-500" />;
      case 'deposit':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeColor = (type: string) => {
    switch (type) {
      case 'payment': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'winner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'member': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'deposit': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary/80 px-6 pt-14 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-primary-foreground hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Notificações</h1>
              {unreadCount > 0 && (
                <p className="text-primary-foreground/80 text-sm">
                  {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === 'unread' ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilter(filter === 'unread' ? 'all' : 'unread')}
              className="text-primary-foreground hover:bg-white/10"
            >
              Não lidas
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-primary-foreground hover:bg-white/10"
              >
                Marcar todas
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 -mt-2">
        {filteredNotifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-foreground mb-2">
              {filter === 'unread' ? 'Todas as notificações foram lidas' : 'Nenhuma notificação'}
            </h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'unread' 
                ? 'Parabéns! Está em dia com todas as suas notificações.'
                : 'As suas notificações aparecerão aqui quando houver atividade.'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`transition-all ${notification.read ? 'opacity-75' : 'shadow-md'}`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                            <h4 className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                              {notification.text}
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{notification.time}</span>
                            <Badge 
                              variant="secondary" 
                              className={`${getNotificationTypeColor(notification.type)} text-xs`}
                            >
                              {notification.type === 'payment' && 'Pagamento'}
                              {notification.type === 'winner' && 'Sorteio'}
                              {notification.type === 'member' && 'Membro'}
                              {notification.type === 'deposit' && 'Depósito'}
                            </Badge>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!notification.read && (
                              <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Marcar como lida
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteNotification(notification.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};