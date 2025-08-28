import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, 
  Users, 
  MessageSquare, 
  Calendar,
  Filter,
  Eye,
  Download,
  Upload,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

const BulkMessaging: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  const mockUsers = [
    { id: 1, name: 'Ana Santos', phone: '+351912345678', email: 'ana@email.pt', plan: 'vip' },
    { id: 2, name: 'Pedro Silva', phone: '+351923456789', email: 'pedro@email.pt', plan: 'free' },
    { id: 3, name: 'Maria João', phone: '+351934567890', email: 'maria@email.pt', plan: 'vip' },
    { id: 4, name: 'João Costa', phone: '+351945678901', email: 'joao@email.pt', plan: 'free' }
  ];

  const campaigns = [
    {
      id: 1,
      name: 'Promoção VIP',
      type: 'email',
      recipients: 45,
      sent: 45,
      opened: 32,
      clicked: 8,
      status: 'completed',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      name: 'Lembrete Pagamento',
      type: 'sms',
      recipients: 12,
      sent: 12,
      delivered: 11,
      failed: 1,
      status: 'completed',
      createdAt: '2024-01-14'
    },
    {
      id: 3,
      name: 'Nova Funcionalidade',
      type: 'email',
      recipients: 67,
      sent: 0,
      status: 'scheduled',
      scheduledFor: '2024-01-20',
      createdAt: '2024-01-13'
    }
  ];

  const handleUserSelect = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === mockUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(mockUsers.map(user => user.id));
    }
  };

  const handleSendMessage = () => {
    console.log('Sending message:', {
      type: messageType,
      recipients: selectedUsers,
      subject,
      message,
      scheduleDate
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Mensagens em Massa</h2>
          <p className="text-gray-600">
            Enviar mensagens para múltiplos utilizadores
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Composer */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Compor Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Mensagem</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="sms"
                      checked={messageType === 'sms'}
                      onChange={(e) => setMessageType(e.target.value as 'sms')}
                    />
                    <span>SMS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      value="email"
                      checked={messageType === 'email'}
                      onChange={(e) => setMessageType(e.target.value as 'email')}
                    />
                    <span>Email</span>
                  </label>
                </div>
              </div>

              {/* Subject (only for email) */}
              {messageType === 'email' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Assunto</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Assunto do email"
                  />
                </div>
              )}

              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium mb-1">Mensagem</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={messageType === 'sms' ? 'Digite a sua mensagem SMS...' : 'Digite o conteúdo do email...'}
                  rows={messageType === 'sms' ? 4 : 6}
                />
                {messageType === 'sms' && (
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length}/160 caracteres
                  </p>
                )}
              </div>

              {/* Schedule */}
              <div>
                <label className="block text-sm font-medium mb-1">Agendamento (opcional)</label>
                <Input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                />
              </div>

              {/* Send Button */}
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={handleSendMessage}
                  disabled={selectedUsers.length === 0 || !message}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {scheduleDate ? 'Agendar Envio' : 'Enviar Agora'}
                  {selectedUsers.length > 0 && ` (${selectedUsers.length} destinatários)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipients */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Destinatários
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Select All */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  checked={selectedUsers.length === mockUsers.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Selecionar todos ({mockUsers.length})
                </span>
              </div>

              {/* Users List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={(checked) => handleUserSelect(user.id, checked as boolean)}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name}</span>
                          <Badge variant={user.plan === 'vip' ? 'default' : 'secondary'}>
                            {user.plan.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {messageType === 'sms' ? user.phone : user.email}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600 pt-2 border-t">
                {selectedUsers.length} de {mockUsers.length} selecionados
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico de Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    <Badge variant={campaign.type === 'sms' ? 'default' : 'secondary'}>
                      {campaign.type.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant={
                        campaign.status === 'completed' ? 'default' : 
                        campaign.status === 'scheduled' ? 'secondary' : 'outline'
                      }
                    >
                      {campaign.status === 'completed' ? 'Concluída' : 
                       campaign.status === 'scheduled' ? 'Agendada' : campaign.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <span>{campaign.recipients} destinatários</span>
                    {campaign.status === 'completed' && (
                      <>
                        <span>{campaign.sent} enviadas</span>
                        {campaign.type === 'email' && campaign.opened && (
                          <span>{campaign.opened} abertas</span>
                        )}
                        {campaign.type === 'sms' && campaign.delivered && (
                          <span>{campaign.delivered} entregues</span>
                        )}
                      </>
                    )}
                    {campaign.scheduledFor && (
                      <span>Agendada para: {campaign.scheduledFor}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BulkMessaging;