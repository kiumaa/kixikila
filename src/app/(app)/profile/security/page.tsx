'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Shield, Lock, Smartphone, LogOut, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/auth-context'
import { toast } from 'sonner'

export default function SecurityPage() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    biometricLogin: false,
    loginNotifications: true
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Sessão terminada com sucesso')
      navigate('/auth')
    } catch (error) {
      toast.error('Erro ao terminar sessão')
    }
  }

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    toast.success('Definição atualizada')
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Segurança</h1>
        </div>

        <div className="space-y-4">
          {/* Authentication Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Autenticação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Autenticação de 2 Fatores</h4>
                  <p className="text-sm text-muted-foreground">Proteção adicional para a sua conta</p>
                </div>
                <Switch
                  checked={settings.twoFactorEnabled}
                  onCheckedChange={() => toggleSetting('twoFactorEnabled')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Login Biométrico</h4>
                  <p className="text-sm text-muted-foreground">Use impressão digital ou Face ID</p>
                </div>
                <Switch
                  checked={settings.biometricLogin}
                  onCheckedChange={() => toggleSetting('biometricLogin')}
                />
              </div>

              <Button variant="outline" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Alterar PIN de Acesso
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Notificações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Alertas de Login</h4>
                  <p className="text-sm text-muted-foreground">Notificar sobre novos acessos</p>
                </div>
                <Switch
                  checked={settings.loginNotifications}
                  onCheckedChange={() => toggleSetting('loginNotifications')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Device Management */}
          <Card>
            <CardHeader>
              <CardTitle>Dispositivos Ativos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium">iPhone 15 Pro</h4>
                  <p className="text-sm text-muted-foreground">Último acesso: agora</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Atual
                </span>
              </div>

              <Button variant="outline" size="sm" className="w-full">
                Gerir Todos os Dispositivos
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Zona Perigosa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="destructive"
                onClick={handleSignOut}
                className="w-full"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Terminar Sessão
              </Button>

              <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10">
                Desativar Conta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}