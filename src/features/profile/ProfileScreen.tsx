import React from 'react';
import { 
  ArrowLeft, Crown, Shield, User, CreditCard, Bell, Lock, 
  FileText, HelpCircle, LogOut, ChevronRight, Settings, Smartphone, Globe
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/design-system/Avatar';
import { StatusBadge } from '@/components/design-system/StatusBadge';
import { ThemeToggle } from '@/components/design-system/ThemeToggle';
import { mockUser, formatCurrency, formatDate } from '@/data/mockData';
import { useAppStore } from '@/store/useAppStore';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onOpenPersonalData: () => void;
  onOpenKYC: () => void;
  onOpenPaymentMethods: () => void;
  onOpenNotificationSettings: () => void;
  onOpenSecurity: () => void;
  onOpenTerms: () => void;
  onOpenSupport: () => void;
  onOpenVIPManagement: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onBack,
  onLogout,
  onOpenPersonalData,
  onOpenKYC,
  onOpenPaymentMethods,
  onOpenNotificationSettings,
  onOpenSecurity,
  onOpenTerms,
  onOpenSupport,
  onOpenVIPManagement
}) => {
  const { userPlan } = useAppStore();
  const isVIP = userPlan === 'vip';
  const menuItems = [
    { 
      icon: User, 
      label: 'Dados Pessoais', 
      onClick: onOpenPersonalData,
      description: 'Nome, email, telemóvel'
    },
    { 
      icon: Shield, 
      label: 'Verificação KYC', 
      onClick: onOpenKYC,
      description: 'Verificação de identidade',
      badge: mockUser.kycStatus === 'verified' ? 'Verificado' : 'Pendente'
    },
    { 
      icon: CreditCard, 
      label: 'Métodos de Pagamento', 
      onClick: onOpenPaymentMethods,
      description: 'Cartões e contas bancárias'
    },
    { 
      icon: Bell, 
      label: 'Notificações', 
      onClick: onOpenNotificationSettings,
      description: 'Preferências de notificações'
    },
    { 
      icon: Lock, 
      label: 'Segurança', 
      onClick: onOpenSecurity,
      description: 'PIN, biometria, autenticação'
    }
  ];

  const supportItems = [
    { 
      icon: FileText, 
      label: 'Termos e Privacidade', 
      onClick: onOpenTerms,
      description: 'Políticas e condições'
    },
    { 
      icon: HelpCircle, 
      label: 'Ajuda e Suporte', 
      onClick: onOpenSupport,
      description: 'FAQ e contacto'
    }
  ];

  return (
    <div className="min-h-screen bg-surface pb-24 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-primary-hover px-6 pt-14 pb-32">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10 ios-button p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold font-system text-primary-foreground">
            Perfil
          </h1>
          <div className="ml-auto">
            <ThemeToggle className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" />
          </div>
        </div>

        {/* Profile Card */}
        <div className="text-center">
          <Avatar 
            name={mockUser.avatar} 
            size="xxl" 
            className="mx-auto mb-4 hover:scale-105 transition-transform" 
            verified={mockUser.kycStatus === 'verified'} 
          />
          <h2 className="text-2xl font-bold font-system text-primary-foreground mb-1">
            {mockUser.name}
          </h2>
          <p className="text-primary-foreground/80 mb-4 font-system">
            {mockUser.email}
          </p>
          
          <div className="flex justify-center gap-2">
            <StatusBadge status={isVIP ? "winner" : "info"}>
              {isVIP ? (
                <>
                  <Crown className="w-3 h-3 mr-1" />
                  Plano VIP
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 mr-1" />
                  Plano Gratuito
                </>
              )}
            </StatusBadge>
            {mockUser.kycStatus === 'verified' && (
              <StatusBadge status="paid">
                <Shield className="w-3 h-3 mr-1" />
                Verificado
              </StatusBadge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Stats */}
        <Card className="ios-card">
          <CardContent className="p-5">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Estatísticas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1 font-system">
                  Trust Score
                </div>
                <div className="text-xl font-bold font-system text-primary">
                  {mockUser.trustScore}%
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1 font-system">
                  Grupos Ativos
                </div>
                <div className="text-xl font-bold font-system text-foreground">
                  {mockUser.activeGroups}
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1 font-system">
                  Ciclos Completos
                </div>
                <div className="text-xl font-bold font-system text-foreground">
                  {mockUser.completedCycles}
                </div>
              </div>
              <div className="bg-surface rounded-lg p-3 text-center">
                <div className="text-xs text-muted-foreground mb-1 font-system">
                  Total Poupado
                </div>
                <div className="text-xl font-bold font-system text-success">
                  {formatCurrency(mockUser.totalSaved)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VIP Status */}
        {isVIP ? (
          <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold font-system text-warning">
                      Plano VIP
                    </h3>
                    <p className="text-xs text-warning/70 font-system">
                      Válido até {formatDate(mockUser.vipExpiry!)}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="ios-button" onClick={onOpenVIPManagement}>
                  Gerir
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-warning/80">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                  <span className="font-system">Grupos ilimitados</span>
                </div>
                <div className="flex items-center gap-2 text-warning/80">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                  <span className="font-system">Relatórios avançados</span>
                </div>
                <div className="flex items-center gap-2 text-warning/80">
                  <div className="w-1.5 h-1.5 bg-warning rounded-full" />
                  <span className="font-system">Suporte prioritário</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="ios-card bg-gradient-to-r from-muted to-muted/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold font-system text-foreground">
                    Plano Gratuito
                  </h3>
                  <p className="text-xs text-muted-foreground font-system">
                    Estás no plano gratuito. Participa em até 2 grupos por convite.
                  </p>
                </div>
                <Button variant="default" size="sm" className="ios-button" onClick={onOpenVIPManagement}>
                  Assinar VIP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Settings */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold font-system text-foreground">
                Conta
              </h3>
            </div>
            <div className="divide-y divide-border">
              {menuItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-surface transition-colors ios-button text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium font-system text-foreground">
                        {item.label}
                      </span>
                      {item.description && (
                        <p className="text-xs text-muted-foreground font-system">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <StatusBadge 
                        status={item.badge === 'Verificado' ? 'paid' : 'pending'} 
                        size="xs"
                      >
                        {item.badge}
                      </StatusBadge>
                    )}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold font-system text-foreground">
                Suporte
              </h3>
            </div>
            <div className="divide-y divide-border">
              {supportItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className="w-full flex items-center justify-between p-5 hover:bg-surface transition-colors ios-button text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <span className="font-medium font-system text-foreground">
                        {item.label}
                      </span>
                      <p className="text-xs text-muted-foreground font-system">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card className="ios-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="font-medium font-system text-foreground">
                    Definições
                  </span>
                  <p className="text-xs text-muted-foreground font-system">
                    Tema, idioma, preferências
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Globe className="w-3 h-3" />
                  <span className="font-system">PT</span>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-between p-5 hover:bg-destructive-subtle transition-colors ios-button text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive-subtle rounded-lg flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-destructive" />
                </div>
                <span className="font-medium font-system text-destructive">
                  Terminar Sessão
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-destructive" />
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};