import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Bell, MessageSquare, Save } from 'lucide-react';

interface NotificationTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationTemplatesModal: React.FC<NotificationTemplatesModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState({
    welcome: { subject: "Bem-vindo ao KIXIKILA!", body: "Olá {name}, bem-vindo à nossa plataforma!" },
    payment: { subject: "Lembrete de Pagamento", body: "Olá {name}, o seu pagamento de {amount} está pendente." },
    winner: { subject: "Parabéns! Foi contemplado!", body: "Olá {name}, foi contemplado com {amount}!" },
    otp: { subject: "Código de Verificação", body: "O seu código é: {code}" }
  });

  const handleSave = () => {
    toast({
      title: "Templates atualizados",
      description: "Os templates de notificação foram guardados com sucesso.",
      variant: "default"
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Gestão de Templates
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="welcome" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="welcome">Boas-vindas</TabsTrigger>
            <TabsTrigger value="payment">Pagamento</TabsTrigger>
            <TabsTrigger value="winner">Contemplado</TabsTrigger>
            <TabsTrigger value="otp">OTP</TabsTrigger>
          </TabsList>

          {Object.entries(templates).map(([key, template]) => (
            <TabsContent key={key} value={key} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{
                    key === 'welcome' ? 'Template de Boas-vindas' :
                    key === 'payment' ? 'Template de Pagamento' :
                    key === 'winner' ? 'Template de Contemplado' :
                    'Template OTP'
                  }</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Assunto</label>
                    <Input
                      value={template.subject}
                      onChange={(e) => setTemplates({
                        ...templates,
                        [key]: { ...template, subject: e.target.value }
                      })}
                      placeholder="Assunto da mensagem"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Corpo da mensagem</label>
                    <Textarea
                      value={template.body}
                      onChange={(e) => setTemplates({
                        ...templates,
                        [key]: { ...template, body: e.target.value }
                      })}
                      placeholder="Corpo da mensagem..."
                      rows={5}
                    />
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800 font-medium mb-1">Variáveis disponíveis:</p>
                    <p className="text-xs text-blue-700">
                      {key === 'welcome' && '{name}'}
                      {key === 'payment' && '{name}, {amount}, {group}'}
                      {key === 'winner' && '{name}, {amount}, {group}'}
                      {key === 'otp' && '{code}, {name}'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button onClick={onClose} variant="outline">Cancelar</Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Templates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationTemplatesModal;