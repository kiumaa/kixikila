import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Eye, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  is_active: boolean;
  language: string;
  created_at: string;
  updated_at: string;
}

const EmailTemplateManager: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subject: '',
    content: '',
    variables: [] as string[],
    is_active: true,
    language: 'pt'
  });

  const categories = [
    { value: 'auth', label: 'Autenticação' },
    { value: 'otp', label: 'Códigos OTP' },
    { value: 'welcome', label: 'Boas-vindas' },
    { value: 'notification', label: 'Notificações' },
    { value: 'payment', label: 'Pagamentos' },
    { value: 'group', label: 'Grupos' },
    { value: 'marketing', label: 'Marketing' }
  ];

  const defaultTemplates = {
    otp: {
      name: 'Código de Verificação OTP',
      subject: '{{brandName}} - Seu código de verificação',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Código de Verificação</h2>
          <p>Olá {{userName}},</p>
          <p>Seu código de verificação é:</p>
          <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
            {{otpCode}}
          </div>
          <p>Este código expira em {{expiryMinutes}} minutos.</p>
          <p>Se você não solicitou este código, ignore este email.</p>
          <hr>
          <small>{{brandName}} - Poupança colaborativa inteligente</small>
        </div>
      `,
      variables: ['brandName', 'userName', 'otpCode', 'expiryMinutes']
    },
    welcome: {
      name: 'Boas-vindas',
      subject: 'Bem-vindo ao {{brandName}}!',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Bem-vindo ao {{brandName}}!</h1>
          <p>Olá {{userName}},</p>
          <p>Estamos muito felizes em ter você conosco! Sua conta foi criada com sucesso.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Próximos passos:</h3>
            <ul>
              <li>Complete seu perfil</li>
              <li>Verifique seu número de telefone</li>
              <li>Explore grupos de poupança disponíveis</li>
            </ul>
          </div>
          
          <p>Se tiver alguma dúvida, nossa equipe está sempre disponível para ajudar.</p>
          <p>Bem-vindo à família {{brandName}}!</p>
          
          <hr>
          <small>{{brandName}} - Poupança colaborativa inteligente</small>
        </div>
      `,
      variables: ['brandName', 'userName']
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { 
          action: 'get_templates',
          type: 'email'
        }
      });

      if (error) throw error;

      setTemplates(data?.data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar templates de email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplate = (type: keyof typeof defaultTemplates) => {
    const template = defaultTemplates[type];
    setFormData({
      name: template.name,
      category: type,
      subject: template.subject,
      content: template.content,
      variables: template.variables,
      is_active: true,
      language: 'pt'
    });
    setSelectedTemplate(null);
    setIsDialogOpen(true);
  };

  const editTemplate = (template: EmailTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      content: template.content,
      variables: template.variables || [],
      is_active: template.is_active,
      language: template.language
    });
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };

  const saveTemplate = async () => {
    try {
      setLoading(true);

      const templateData = {
        ...formData,
        type: 'email'
      };

      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase.functions.invoke('manage-system-config', {
          body: {
            action: 'update_template',
            id: selectedTemplate.id,
            ...templateData
          }
        });
        if (error) throw error;
      } else {
        // Create new template
        const { error } = await supabase.functions.invoke('manage-system-config', {
          body: {
            action: 'create_template',
            ...templateData
          }
        });
        if (error) throw error;
      }

      toast({
        title: 'Sucesso',
        description: 'Template salvo com sucesso'
      });

      setIsDialogOpen(false);
      loadTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar template',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const previewTemplate = (template: EmailTemplate) => {
    const mockData = {
      brandName: 'KIXIKILA',
      userName: 'João Silva',
      otpCode: '123456',
      expiryMinutes: '10'
    };

    let previewContent = template.content;
    let previewSubject = template.subject;

    // Replace variables with mock data
    template.variables?.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      const value = mockData[variable as keyof typeof mockData] || `[${variable}]`;
      previewContent = previewContent.replace(regex, value);
      previewSubject = previewSubject.replace(regex, value);
    });

    setPreviewData({
      subject: previewSubject,
      content: previewContent
    });
  };

  const addVariable = () => {
    const newVar = prompt('Nome da variável (sem {{}}):');
    if (newVar && !formData.variables.includes(newVar)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, newVar]
      }));
    }
  };

  const removeVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v !== variable)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Templates de Email</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie templates de email para diferentes tipos de notificações
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => createDefaultTemplate('otp')}
          >
            + Template OTP
          </Button>
          <Button 
            variant="outline"
            onClick={() => createDefaultTemplate('welcome')}
          >
            + Template Boas-vindas
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedTemplate(null)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTemplate ? 'Editar Template' : 'Novo Template'}
                </DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Nome do Template</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Código de verificação"
                    />
                  </div>
                  
                  <div>
                    <Label>Categoria</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Assunto</Label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="{{brandName}} - Seu código de verificação"
                    />
                  </div>
                  
                  <div>
                    <Label>Variáveis</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.variables.map(variable => (
                        <Badge key={variable} variant="secondary">
                          {`{{${variable}}}`}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0"
                            onClick={() => removeVariable(variable)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={addVariable}>
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar Variável
                    </Button>
                  </div>
                  
                  <div>
                    <Label>Conteúdo HTML</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Conteúdo do email em HTML..."
                      rows={12}
                      className="font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Pré-visualização</Label>
                  <div className="border rounded-lg p-4 bg-gray-50 min-h-[400px]">
                    <div className="mb-4">
                      <strong>Assunto:</strong> {formData.subject.replace(/{{(\w+)}}/g, '[var]')}
                    </div>
                    <div 
                      dangerouslySetInnerHTML={{ 
                        __html: formData.content.replace(/{{(\w+)}}/g, '<span class="bg-yellow-200 px-1">[$1]</span>')
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={saveTemplate} disabled={loading}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {templates.map(template => (
          <Card key={template.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant={template.is_active ? "default" : "secondary"}>
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    <strong>Assunto:</strong> {template.subject}
                  </p>
                  {template.variables?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <span className="text-xs text-muted-foreground">Variáveis:</span>
                      {template.variables.map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {`{{${variable}}}`}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewTemplate(template)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => editTemplate(template)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Dialog */}
      {previewData && (
        <Dialog open={!!previewData} onOpenChange={() => setPreviewData(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pré-visualização do Email</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Assunto</Label>
                <div className="bg-gray-100 p-2 rounded">{previewData.subject}</div>
              </div>
              <div>
                <Label>Conteúdo</Label>
                <div 
                  className="border p-4 rounded bg-white"
                  dangerouslySetInnerHTML={{ __html: previewData.content }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EmailTemplateManager;