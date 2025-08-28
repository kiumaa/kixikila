import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Copy,
  Send,
  FileText
} from 'lucide-react';

const MessageTemplates: React.FC = () => {
  const [templates] = useState([
    {
      id: 1,
      name: 'Bem-vindo',
      type: 'sms',
      subject: null,
      content: 'Olá {name}, bem-vindo ao KIXIKILA! O seu código de verificação é: {code}',
      variables: ['name', 'code'],
      usage: 156
    },
    {
      id: 2,
      name: 'Pagamento Vencido',
      type: 'email',
      subject: 'Pagamento Pendente - KIXIKILA',
      content: 'Caro {name}, o pagamento do grupo {group_name} está vencido. Valor: {amount}€',
      variables: ['name', 'group_name', 'amount'],
      usage: 23
    },
    {
      id: 3,
      name: 'Contemplação',
      type: 'sms',
      subject: null,
      content: 'Parabéns {name}! Foi contemplado no grupo {group_name}. Valor: {amount}€',
      variables: ['name', 'group_name', 'amount'],
      usage: 8
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'sms',
    subject: '',
    content: '',
    variables: []
  });

  const extractVariables = (content: string) => {
    const matches = content.match(/{([^}]+)}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleContentChange = (content: string) => {
    const variables = extractVariables(content);
    setNewTemplate(prev => ({
      ...prev,
      content,
      variables
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h2>
          <p className="text-gray-600">
            Gerir templates para SMS e Email
          </p>
        </div>
        
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Criar Novo Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome do Template</label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Bem-vindo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select 
                  className="w-full p-2 border border-gray-200 rounded-lg"
                  value={newTemplate.type}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>

            {newTemplate.type === 'email' && (
              <div>
                <label className="block text-sm font-medium mb-1">Assunto</label>
                <Input
                  value={newTemplate.subject}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Assunto do email"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Conteúdo</label>
              <Textarea
                value={newTemplate.content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Digite o conteúdo da mensagem. Use {variavel} para variáveis dinâmicas."
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use chaves {} para variáveis dinâmicas. Ex: {'{name}'}, {'{amount}'}, {'{group_name}'}
              </p>
            </div>

            {newTemplate.variables.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">Variáveis Detectadas</label>
                <div className="flex gap-2 flex-wrap">
                  {newTemplate.variables.map((variable, index) => (
                    <Badge key={index} variant="outline">
                      {variable}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button>
                Criar Template
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{template.name}</h3>
                    <Badge variant={template.type === 'sms' ? 'default' : 'secondary'}>
                      {template.type.toUpperCase()}
                    </Badge>
                    <Badge variant="outline">
                      {template.usage} usos
                    </Badge>
                  </div>

                  {template.subject && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-gray-600">Assunto: </span>
                      <span className="text-sm">{template.subject}</span>
                    </div>
                  )}

                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-600">Conteúdo: </span>
                    <p className="text-sm bg-gray-50 p-2 rounded mt-1">{template.content}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Variáveis: </span>
                    <div className="flex gap-1 flex-wrap">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Crie o seu primeiro template de mensagem.
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MessageTemplates;