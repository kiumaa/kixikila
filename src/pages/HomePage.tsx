import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Wallet, Users, Settings, LogOut, Shield, Crown, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMockAuthStore } from '@/stores/useMockAuthStore';
import { usePinManagement } from '@/hooks/usePinManagement';
import { useToast } from '@/hooks/use-toast';
import { useKycProcess } from '@/hooks/useKycProcess';
import KycPopup from '@/components/modals/KycPopup';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, logout } = useMockAuthStore();
  const { hasPinConfigured, clearPin } = usePinManagement();
  const { kycData } = useKycProcess();
  const [showKycPopup, setShowKycPopup] = useState(false);

  const handleLogout = () => {
    if (user) {
      clearPin(user.id);
    }
    logout();
    toast({
      title: "Sessão terminada",
      description: "Até à próxima! 👋",
    });
    navigate('/auth/login');
  };

  if (!user) {
    navigate('/auth/login');
    return null;
  }

  const isPinConfigured = hasPinConfigured(user.id);

  const getKycStatusInfo = () => {
    switch (kycData.status) {
      case 'approved':
        return { icon: Shield, text: 'Verificado', color: 'text-success', bgColor: 'bg-success/10' };
      case 'pending':
      case 'in_review':
        return { icon: AlertCircle, text: 'Em Análise', color: 'text-warning', bgColor: 'bg-warning/10' };
      case 'rejected':
        return { icon: AlertCircle, text: 'Rejeitado', color: 'text-destructive', bgColor: 'bg-destructive/10' };
      default:
        return { icon: FileText, text: 'Pendente', color: 'text-muted-foreground', bgColor: 'bg-muted/10' };
    }
  };

  const kycStatusInfo = getKycStatusInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-subtle via-background to-accent">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-darker px-6 pt-14 pb-32">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground mb-1">
              Olá, {user.name || user.phone.slice(-4)} 👋
            </h1>
            <p className="text-primary-foreground/80">
              Bem-vindo ao KIXIKILA
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary-foreground/10 backdrop-blur-sm border-0 text-primary-foreground">
            <CardContent className="p-4 text-center">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <div className="text-xl font-bold">
                {isPinConfigured ? 'Ativo' : 'Pendente'}
              </div>
              <div className="text-xs opacity-80">Segurança PIN</div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary-foreground/10 backdrop-blur-sm border-0 text-primary-foreground">
            <CardContent className="p-4 text-center">
              <kycStatusInfo.icon className="w-8 h-8 mx-auto mb-2" />
              <div className="text-xl font-bold">
                {kycStatusInfo.text}
              </div>
              <div className="text-xs opacity-80">Estado KYC</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-6">
        {/* Account Status Card */}
        <Card className="ios-card animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estado da Conta</span>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                ✨ Ativa
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                <p className="font-semibold text-sm">{user.phone}</p>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Membro desde</p>
                <p className="font-semibold text-sm">
                  {new Date(user.createdAt).toLocaleDateString('pt-PT')}
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
                <Shield className="w-4 h-4 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-success">PIN Configurado</p>
                  <p className="text-xs text-success/80">
                    {isPinConfigured ? 'Acesso rápido ativo' : 'Configure seu PIN'}
                  </p>
                </div>
              </div>

              <div 
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${kycStatusInfo.bgColor} border-current`}
                onClick={() => setShowKycPopup(true)}
              >
                <kycStatusInfo.icon className={`w-4 h-4 ${kycStatusInfo.color}`} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${kycStatusInfo.color}`}>
                    Verificação de Identidade
                  </p>
                  <p className={`text-xs ${kycStatusInfo.color}/80`}>
                    {kycData.status === 'approved' ? 'Conta verificada' :
                     kycData.status === 'pending' || kycData.status === 'in_review' ? 'Análise em progresso' :
                     kycData.status === 'rejected' ? 'Tenta novamente' :
                     'Completa a tua verificação'}
                  </p>
                </div>
                {kycData.status === 'not_started' && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="ios-card hover-scale cursor-pointer" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade em desenvolvimento" })}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Carteira</h3>
              <p className="text-xs text-muted-foreground">Gerir fundos</p>
            </CardContent>
          </Card>
          
          <Card className="ios-card hover-scale cursor-pointer" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade em desenvolvimento" })}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Grupos</h3>
              <p className="text-xs text-muted-foreground">Poupanças</p>
            </CardContent>
          </Card>
          
          <Card className="ios-card hover-scale cursor-pointer" onClick={() => toast({ title: "Em breve!", description: "Funcionalidade em desenvolvimento" })}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Settings className="w-6 h-6 text-warning" />
              </div>
              <h3 className="font-semibold text-sm mb-1">Definições</h3>
              <p className="text-xs text-muted-foreground">Configurar</p>
            </CardContent>
          </Card>
          
          <Card className="ios-card hover-scale cursor-pointer" onClick={() => navigate('/auth/app')}>
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Home className="w-6 h-6 text-success" />
              </div>
              <h3 className="font-semibold text-sm mb-1">App Demo</h3>
              <p className="text-xs text-muted-foreground">Ver prototype</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="ios-card bg-gradient-to-r from-primary-subtle to-accent-subtle border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-primary mb-2">🎉 Fase 2 Completa!</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Parabéns! Completaste com sucesso:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• ✅ Autenticação por SMS</li>
                  <li>• ✅ PIN de 4 dígitos seguro</li>
                  <li>• ✅ Sistema de verificação KYC</li>
                  <li>• ✅ Acesso à plataforma</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Info */}
        <div className="pb-8">
          <Card className="ios-card bg-muted/30">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">
                🚀 KIXIKILA - Versão de Desenvolvimento
              </p>
              <p className="text-xs text-muted-foreground">
                Esta é uma versão de teste. Funcionalidades completas em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* KYC Popup */}
      <KycPopup
        isOpen={showKycPopup}
        onClose={() => setShowKycPopup(false)}
        onStartKyc={() => {}}
      />
    </div>
  );
};

export default HomePage;