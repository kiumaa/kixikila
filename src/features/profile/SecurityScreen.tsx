import React, { useState } from 'react';
import { ArrowLeft, Lock, Smartphone, Key, Shield, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

interface SecurityScreenProps {
  onBack: () => void;
}

export const SecurityScreen: React.FC<SecurityScreenProps> = ({
  onBack
}) => {
  const [settings, setSettings] = useState({
    biometricEnabled: true,
    pinEnabled: true,
    autoLock: true,
    loginNotifications: true
  });
  const [showChangePin, setShowChangePin] = useState(false);
  const [pinData, setPinData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [isChangingPin, setIsChangingPin] = useState(false);
  const { toast } = useToast();

  const handleToggle = (key: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const handleChangePin = async () => {
    if (pinData.newPin !== pinData.confirmPin) {
      toast({
        title: "Erro",
        description: "Os PINs não coincidem. Tente novamente."
      });
      return;
    }

    setIsChangingPin(true);
    // Simulate PIN change
    setTimeout(() => {
      setIsChangingPin(false);
      setShowChangePin(false);
      setPinData({ currentPin: '', newPin: '', confirmPin: '' });
      toast({
        title: "PIN alterado",
        description: "O seu PIN foi alterado com sucesso."
      });
    }, 2000);
  };

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
            Segurança
          </h1>
        </div>

        {/* Security Status */}
        <Card className="glass text-primary-foreground border-primary-foreground/20">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold font-system mb-2">
              Conta Protegida
            </h2>
            <p className="text-primary-foreground/80 text-sm">
              As suas definições de segurança estão ativas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-6 -mt-8 space-y-6">
        {/* Authentication Methods */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold font-system text-foreground">
                Métodos de Autenticação
              </h3>
            </div>
            
            <div className="divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      Biometria
                    </div>
                    <div className="text-sm text-muted-foreground font-system">
                      Face ID / Touch ID / Impressão digital
                    </div>
                  </div>
                </div>
                <Switch
                  checked={settings.biometricEnabled}
                  onCheckedChange={() => handleToggle('biometricEnabled')}
                />
              </div>

              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <div className="font-medium font-system text-foreground">
                      PIN de Segurança
                    </div>
                    <div className="text-sm text-muted-foreground font-system">
                      Código de 6 dígitos para acesso
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setShowChangePin(true)}
                    variant="outline"
                    size="sm"
                    className="ios-button"
                  >
                    Alterar
                  </Button>
                  <Switch
                    checked={settings.pinEnabled}
                    onCheckedChange={() => handleToggle('pinEnabled')}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Change PIN Modal */}
        {showChangePin && (
          <Card className="ios-card bg-gradient-to-r from-warning-subtle to-warning-subtle/50 border-warning/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold font-system text-warning">
                  Alterar PIN
                </h3>
                <Button
                  onClick={() => setShowChangePin(false)}
                  variant="outline"
                  size="sm"
                  className="ios-button"
                >
                  Cancelar
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium font-system text-foreground mb-2">
                    PIN Atual
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={pinData.currentPin}
                      onChange={(e) => setPinData({...pinData, currentPin: e.target.value})}
                      className="pl-10"
                      maxLength={6}
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium font-system text-foreground mb-2">
                    Novo PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={pinData.newPin}
                      onChange={(e) => setPinData({...pinData, newPin: e.target.value})}
                      className="pl-10"
                      maxLength={6}
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium font-system text-foreground mb-2">
                    Confirmar Novo PIN
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      type="password"
                      value={pinData.confirmPin}
                      onChange={(e) => setPinData({...pinData, confirmPin: e.target.value})}
                      className="pl-10"
                      maxLength={6}
                      placeholder="••••••"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleChangePin}
                  disabled={isChangingPin || !pinData.currentPin || !pinData.newPin || !pinData.confirmPin}
                  className="w-full ios-button"
                >
                  {isChangingPin ? 'A alterar...' : 'Alterar PIN'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Security Settings */}
        <Card className="ios-card">
          <CardContent className="p-0">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold font-system text-foreground">
                Definições de Segurança
              </h3>
            </div>
            
            <div className="divide-y divide-border">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium font-system text-foreground">
                    Bloqueio Automático
                  </div>
                  <div className="text-sm text-muted-foreground font-system">
                    Bloquear app após 5 minutos de inatividade
                  </div>
                </div>
                <Switch
                  checked={settings.autoLock}
                  onCheckedChange={() => handleToggle('autoLock')}
                />
              </div>

              <div className="p-6 flex items-center justify-between">
                <div>
                  <div className="font-medium font-system text-foreground">
                    Notificações de Login
                  </div>
                  <div className="text-sm text-muted-foreground font-system">
                    Avisar sobre novos acessos à conta
                  </div>
                </div>
                <Switch
                  checked={settings.loginNotifications}
                  onCheckedChange={() => handleToggle('loginNotifications')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="ios-card bg-gradient-to-r from-info-subtle to-info-subtle/50 border-info/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-info/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-info" />
              </div>
              <div>
                <h3 className="font-semibold font-system text-info mb-2">
                  Dicas de Segurança
                </h3>
                <ul className="text-sm text-info/80 space-y-1 font-system">
                  <li>• Use um PIN único que não partilhe</li>
                  <li>• Ative a biometria para maior segurança</li>
                  <li>• Não aceda à conta em dispositivos partilhados</li>
                  <li>• Reporte atividade suspeita imediatamente</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Actions */}
        <Card className="ios-card">
          <CardContent className="p-6">
            <h3 className="font-semibold font-system text-foreground mb-4">
              Ações de Emergência
            </h3>
            <div className="space-y-3">
              <Button
                variant="outline" 
                className="w-full ios-button justify-start"
              >
                <Lock className="w-4 h-4 mr-3" />
                Bloquear Conta Temporariamente
              </Button>
              <Button
                variant="outline"
                className="w-full ios-button justify-start"
              >
                <Key className="w-4 h-4 mr-3" />
                Repor PIN (via SMS)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};