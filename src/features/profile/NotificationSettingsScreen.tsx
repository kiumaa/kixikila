import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone, Users, Euro, Trophy, AlertTriangle, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences } from '@/hooks/useNotifications';

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onBack
}) => {
  const { toast } = useToast();
  const {
    preferences,
    isLoading,
    updatePreferences,
    sendTestNotification,
    requestPermission
  } = useNotificationPreferences();

  const [localSettings, setLocalSettings] = useState({
    push_notifications: true,
    email_notifications: true,
    sms_notifications: false,
    group_notifications: true,
    payment_notifications: true,
    security_notifications: true,
    marketing_notifications: false
  });

  // Sync with loaded preferences
  useEffect(() => {
    if (preferences) {
      setLocalSettings(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: string) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSave = async () => {
    await updatePreferences(localSettings);
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      setLocalSettings(prev => ({ ...prev, push_notifications: true }));
    }
  };

  const notificationCategories = [
    {
      title: 'Notificações Push',
      description: 'Notificações no dispositivo',
      icon: Smartphone,
      settings: [
        { key: 'push_notifications', label: 'Ativar notificações push', sublabel: 'Receber notificações no dispositivo' }
      ]
    },
    {
      title: 'Notificações por Email',
      description: 'Emails para o seu endereço registado',
      icon: Mail,
      settings: [
        { key: 'email_notifications', label: 'Ativar emails', sublabel: 'Receber notificações por email' }
      ]
    },
    {
      title: 'Notificações SMS',
      description: 'Mensagens para o seu telemóvel',
      icon: Smartphone,
      settings: [
        { key: 'sms_notifications', label: 'Ativar SMS', sublabel: 'Receber mensagens de texto' }
      ]
    },
    {
      title: 'Categorias de Notificações',
      description: 'Tipos de notificações que quer receber',
      icon: Bell,
      settings: [
        { key: 'group_notifications', label: 'Notificações de grupos', sublabel: 'Atividade dos grupos, novos membros, etc.' },
        { key: 'payment_notifications', label: 'Notificações de pagamentos', sublabel: 'Lembretes e confirmações de pagamentos' },
        { key: 'security_notifications', label: 'Alertas de segurança', sublabel: 'Notificações importantes de segurança' },
        { key: 'marketing_notifications', label: 'Promoções e novidades', sublabel: 'Ofertas especiais e funcionalidades' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-24">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Notificações
          </h1>
        </div>

        {/* Status Card */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              Gerir Notificações
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              Configure como e quando quer ser notificado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Settings Categories */}
        {notificationCategories.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="ios-card">
            <CardContent className="p-0">
              <div className="p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-system text-foreground">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-system">
                      {category.description}
                    </p>
                  </div>
                </div>
              </div>
              
                  <div className="divide-y divide-border">
                {category.settings.map((setting, settingIndex) => (
                  <div key={settingIndex} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium font-system text-foreground">
                        {setting.label}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 font-system">
                        {setting.sublabel}
                      </div>
                    </div>
                    <Switch
                      checked={localSettings[setting.key as keyof typeof localSettings]}
                      onCheckedChange={() => handleToggle(setting.key)}
                      disabled={isLoading}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Test & Permission Cards */}
        <div className="grid grid-cols-1 gap-4">
          <Card className="ios-card bg-gradient-to-r from-info-subtle to-info-subtle/50 border-info/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TestTube className="w-4 h-4 text-info" />
                </div>
                <div>
                  <h3 className="font-semibold font-system text-info mb-1">
                    Testar Notificações
                  </h3>
                  <p className="text-sm text-info/80 font-system">
                    Envie uma notificação de teste para verificar se tudo está a funcionar
                  </p>
                </div>
              </div>
              
              <Button
                onClick={handleTestNotification}
                variant="outline"
                size="sm"
                className="w-full ios-button"
                disabled={isLoading}
              >
                Enviar Notificação de Teste
              </Button>
            </CardContent>
          </Card>

          {!localSettings.push_notifications && (
            <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-system text-warning mb-1">
                      Permissões de Notificação
                    </h3>
                    <p className="text-sm text-warning/80 font-system">
                      Ative as permissões do navegador para receber notificações push
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleRequestPermission}
                  variant="outline"
                  size="sm"
                  className="w-full ios-button"
                  disabled={isLoading}
                >
                  Ativar Permissões
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Settings */}
        <Card className="ios-card bg-gradient-to-r from-muted-subtle to-muted-subtle/50 border-muted/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-muted/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold font-system text-foreground mb-1">
                  Configurações Rápidas
                </h3>
                <p className="text-sm text-muted-foreground font-system">
                  Ative ou desative todas as notificações rapidamente
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setLocalSettings(prev => ({
                    ...prev,
                    push_notifications: true,
                    email_notifications: true,
                    group_notifications: true,
                    payment_notifications: true,
                    security_notifications: true
                  }));
                }}
                variant="outline"
                size="sm"
                className="flex-1 ios-button"
                disabled={isLoading}
              >
                Ativar Essenciais
              </Button>
              <Button
                onClick={() => {
                  setLocalSettings(prev => ({
                    ...prev,
                    push_notifications: false,
                    email_notifications: false,
                    sms_notifications: false,
                    group_notifications: false,
                    payment_notifications: false,
                    marketing_notifications: false
                  }));
                }}
                variant="outline"
                size="sm"
                className="flex-1 ios-button"
                disabled={isLoading}
              >
                Desativar Todas
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="sticky bottom-24 pt-4">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="w-full ios-button"
            size="lg"
          >
            {isLoading ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
};