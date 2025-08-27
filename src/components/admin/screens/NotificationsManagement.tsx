import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Send } from 'lucide-react';

const NotificationsManagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Gestão de Notificações</h2>
        <p className="text-gray-600">Envie mensagens e notificações para os utilizadores</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Enviar Notificação Global
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
    </div>
  );
};

export default NotificationsManagement;