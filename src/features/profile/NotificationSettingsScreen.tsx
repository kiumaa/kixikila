import React, { useState } from 'react';
import { ArrowLeft, Bell, Mail, Smartphone, Users, Euro, Trophy, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettingsScreenProps {
  onBack: () => void;
}

export const NotificationSettingsScreen: React.FC<NotificationSettingsScreenProps> = ({
  onBack
}) => {
  const [settings, setSettings] = useState({
    // Push Notifications
    pushEnabled: true,
    paymentReminders: true,
    groupActivity: true,
    drawResults: true,
    systemAlerts: true,
    
    // Email Notifications
    emailEnabled: true,
    weeklyReports: true,
    monthlyStatements: false,
    promotions: false,
    
    // SMS Notifications
    smsEnabled: false,
    urgentAlerts: true,
    paymentConfirmations: false
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Definições guardadas",
        description: "As suas preferências de notificações foram atualizadas."
      });
    }, 1500);
  };

  const notificationCategories = [
    {
      title: 'Notificações Push',
      description: 'Notificações no dispositivo',
      icon: Smartphone,
      settings: [
        { key: 'pushEnabled', label: 'Ativar notificações push', sublabel: 'Receber notificações no dispositivo' },
        { key: 'paymentReminders', label: 'Lembretes de pagamento', sublabel: 'Avisos antes das datas de pagamento' },
        { key: 'groupActivity', label: 'Atividade dos grupos', sublabel: 'Novos membros, pagamentos, etc.' },
        { key: 'drawResults', label: 'Resultados de sorteios', sublabel: 'Quando há um novo contemplado' },
        { key: 'systemAlerts', label: 'Alertas do sistema', sublabel: 'Manutenções e atualizações importantes' }
      ]
    },
    {
      title: 'Notificações por Email',
      description: 'Emails para o seu endereço registado',
      icon: Mail,
      settings: [
        { key: 'emailEnabled', label: 'Ativar emails', sublabel: 'Receber notificações por email' },
        { key: 'weeklyReports', label: 'Relatórios semanais', sublabel: 'Resumo da atividade da semana' },
        { key: 'monthlyStatements', label: 'Extratos mensais', sublabel: 'Resumo financeiro do mês' },
        { key: 'promotions', label: 'Promoções e novidades', sublabel: 'Ofertas especiais e funcionalidades' }
      ]
    },
    {
      title: 'Notificações SMS',
      description: 'Mensagens para o seu telemóvel',
      icon: Smartphone,
      settings: [
        { key: 'smsEnabled', label: 'Ativar SMS', sublabel: 'Receber mensagens de texto' },
        { key: 'urgentAlerts', label: 'Alertas urgentes', sublabel: 'Apenas notificações críticas' },
        { key: 'paymentConfirmations', label: 'Confirmações de pagamento', sublabel: 'SMS após cada transação' }
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
                      checked={settings[setting.key as keyof typeof settings]}
                      onCheckedChange={() => handleToggle(setting.key)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Quick Settings */}
        <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold font-system text-warning mb-1">
                  Configurações Rápidas
                </h3>
                <p className="text-sm text-warning/80 font-system">
                  Ative ou desative todas as notificações rapidamente
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    pushEnabled: true,
                    emailEnabled: true,
                    paymentReminders: true,
                    groupActivity: true,
                    drawResults: true
                  }));
                }}
                variant="outline"
                size="sm"
                className="flex-1 ios-button"
              >
                Ativar Essenciais
              </Button>
              <Button
                onClick={() => {
                  setSettings(prev => ({
                    ...prev,
                    pushEnabled: false,
                    emailEnabled: false,
                    smsEnabled: false,
                    paymentReminders: false,
                    groupActivity: false,
                    drawResults: false,
                    weeklyReports: false,
                    monthlyStatements: false,
                    promotions: false
                  }));
                }}
                variant="outline"
                size="sm"
                className="flex-1 ios-button"
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
            disabled={isSaving}
            className="w-full ios-button"
            size="lg"
          >
            {isSaving ? 'A guardar...' : 'Guardar Alterações'}
          </Button>
        </div>
      </div>
    </div>
  );
};