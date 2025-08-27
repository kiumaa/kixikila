import React from 'react';
import { ArrowLeft, Bell, Calendar, Crown, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockNotifications, formatDate } from '@/data/mockData';

interface NotificationsScreenProps {
  onBack: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <Calendar className="w-5 h-5 text-primary" />;
      case 'winner':
        return <Crown className="w-5 h-5 text-warning" />;
      case 'deposit':
        return <TrendingUp className="w-5 h-5 text-success" />;
      case 'member':
        return <Users className="w-5 h-5 text-info" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-8">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Notificações
          </h1>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 space-y-3">
        {mockNotifications.length > 0 ? (
          mockNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`ios-card cursor-pointer ${
                !notification.read ? 'ring-2 ring-primary/20 bg-primary-subtle/30' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium font-system ${
                      !notification.read ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {notification.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="ios-card">
            <CardContent className="p-8 text-center space-y-4">
              <Bell className="w-12 h-12 text-muted mx-auto" />
              <div>
                <p className="text-muted-foreground font-medium">
                  Sem notificações
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  As suas notificações aparecerão aqui
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};