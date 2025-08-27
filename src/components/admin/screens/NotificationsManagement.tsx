import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bell, Send, Smartphone, Settings } from 'lucide-react';

const NotificationsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Notificações</h2>
        <p className="text-gray-600">Configure notificações push e SMS para os utilizadores</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificação Push Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Escreva sua mensagem..." rows={4} />
            <Button>
              <Send className="w-4 h-4 mr-2" />
              Enviar para Todos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              SMS Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Mensagem SMS..." rows={4} maxLength={160} />
            <div className="text-xs text-gray-500">Máximo 160 caracteres</div>
            <Button>
              <Smartphone className="w-4 h-4 mr-2" />
              Enviar SMS para Todos
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações SMS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Templates Automáticos</h4>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">SMS de Boas-vindas</label>
                  <p className="text-xs text-gray-500">Enviado quando utilizador se regista</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Lembrete de Pagamento</label>
                  <p className="text-xs text-gray-500">Enviado 2 dias antes do pagamento</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Confirmação de Sorteio</label>
                  <p className="text-xs text-gray-500">Enviado quando utilizador é contemplado</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Código OTP</label>
                  <p className="text-xs text-gray-500">Enviado para autenticação</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Configurações Gerais</h4>
              
              <div>
                <label className="block text-sm font-medium mb-2">Remetente Padrão</label>
                <Input placeholder="KIXIKILA" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Horário de Envio</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="time" defaultValue="09:00" />
                  <Input type="time" defaultValue="18:00" />
                </div>
                <p className="text-xs text-gray-500 mt-1">SMS serão enviados apenas neste intervalo</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Pausar Envios</label>
                  <p className="text-xs text-gray-500">Suspender temporariamente todos os SMS</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Guardar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsManagement;