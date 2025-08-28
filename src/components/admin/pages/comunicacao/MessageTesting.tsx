import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Send, TestTube, AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MessageTemplate {
  id: string;
  name: string;
  type: string;
  category: string;
  subject?: string | null;
  content: string;
  variables: string[];
}

interface TestResult {
  id: string;
  type: string;
  recipient: string;
  template: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  timestamp: string;
  message?: string;
}

export default function MessageTesting() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [recipient, setRecipient] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testMode, setTestMode] = useState<'template' | 'custom'>('template');

  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      // Process the data to ensure variables is an array of strings
      const processedTemplates = (data || []).map(template => {
        let variables: string[] = [];
        
        // Parse variables from JSON or ensure it's an array
        if (template.variables) {
          if (Array.isArray(template.variables)) {
            variables = template.variables.filter((v): v is string => typeof v === 'string');
          } else if (typeof template.variables === 'string') {
            try {
              const parsed = JSON.parse(template.variables);
              variables = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
            } catch {
              variables = [];
            }
          }
        }
        
        return {
          id: template.id,
          name: template.name,
          type: template.type,
          category: template.category,
          subject: template.subject,
          content: template.content,
          variables
        };
      });
      
      setTemplates(processedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Erro ao carregar templates');
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setCustomContent(template.content);
      
      // Initialize variables with empty values
      const initialVars: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialVars[variable] = '';
      });
      setVariables(initialVars);
    }
  };

  const processContent = (content: string, vars: Record<string, string>) => {
    let processedContent = content;
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{${key}}`, 'g');
      processedContent = processedContent.replace(regex, value || `{${key}}`);
    });
    return processedContent;
  };

  const sendTestMessage = async () => {
    if (!recipient) {
      toast.error('Por favor, insira um destinatário');
      return;
    }

    if (testMode === 'template' && !selectedTemplate) {
      toast.error('Por favor, selecione um template');
      return;
    }

    if (testMode === 'custom' && !customContent) {
      toast.error('Por favor, insira o conteúdo da mensagem');
      return;
    }

    setLoading(true);

    try {
      const messageData = {
        type: testMode === 'template' ? selectedTemplate?.type : 'sms',
        recipient: recipient,
        content: testMode === 'template' 
          ? processContent(selectedTemplate?.content || '', variables)
          : customContent,
        subject: testMode === 'template' ? selectedTemplate?.subject : undefined,
        template_id: testMode === 'template' ? selectedTemplate?.id : null,
        is_test: true
      };

      console.log('Sending test message:', messageData);

      const { data, error } = await supabase.functions.invoke('send-message', {
        body: messageData
      });

      if (error) throw error;

      // Add to test results
      const newResult: TestResult = {
        id: Date.now().toString(),
        type: messageData.type || 'sms',
        recipient: recipient,
        template: testMode === 'template' ? selectedTemplate?.name || 'Custom' : 'Custom',
        status: 'sent',
        timestamp: new Date().toLocaleString('pt-PT'),
        message: data?.message || 'Mensagem enviada com sucesso'
      };

      setTestResults(prev => [newResult, ...prev]);
      toast.success('Mensagem de teste enviada com sucesso!');
      
    } catch (error: any) {
      console.error('Error sending test message:', error);
      
      const newResult: TestResult = {
        id: Date.now().toString(),
        type: testMode === 'template' ? selectedTemplate?.type || 'sms' : 'sms',
        recipient: recipient,
        template: testMode === 'template' ? selectedTemplate?.name || 'Custom' : 'Custom',
        status: 'failed',
        timestamp: new Date().toLocaleString('pt-PT'),
        message: error?.message || 'Erro desconhecido'
      };

      setTestResults(prev => [newResult, ...prev]);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TestTube className="w-5 h-5" />
        <h1 className="text-2xl font-bold">Sistema de Testes de Mensagens</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Configurar Teste
            </CardTitle>
            <CardDescription>
              Configure e envie mensagens de teste para validar templates e conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={testMode} onValueChange={(value) => setTestMode(value as 'template' | 'custom')}>
              <TabsList className="w-full">
                <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
                <TabsTrigger value="custom" className="flex-1">Personalizada</TabsTrigger>
              </TabsList>

              <TabsContent value="template" className="space-y-4">
                <div>
                  <Label htmlFor="template-select">Selecionar Template</Label>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolher template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {template.type.toUpperCase()}
                            </Badge>
                            {template.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && selectedTemplate.variables.length > 0 && (
                  <div className="space-y-3">
                    <Label>Variáveis do Template</Label>
                    {selectedTemplate.variables.map((variable) => (
                      <div key={variable}>
                        <Label htmlFor={`var-${variable}`} className="text-sm">
                          {variable}
                        </Label>
                        <Input
                          id={`var-${variable}`}
                          placeholder={`Valor para {${variable}}`}
                          value={variables[variable] || ''}
                          onChange={(e) => 
                            setVariables(prev => ({
                              ...prev,
                              [variable]: e.target.value
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="custom" className="space-y-4">
                <div>
                  <Label htmlFor="custom-content">Conteúdo da Mensagem</Label>
                  <Textarea
                    id="custom-content"
                    placeholder="Digite o conteúdo da mensagem..."
                    value={customContent}
                    onChange={(e) => setCustomContent(e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="recipient">Destinatário</Label>
              <Input
                id="recipient"
                placeholder="Email ou número de telefone (ex: +351912345678)"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </div>

            {/* Message Preview */}
            {(selectedTemplate || customContent) && (
              <div className="space-y-2">
                <Label>Pré-visualização</Label>
                <div className="p-3 bg-muted rounded-lg border">
                  <div className="text-sm font-medium mb-1">
                    {testMode === 'template' && selectedTemplate?.subject && (
                      <div className="text-primary">
                        Assunto: {processContent(selectedTemplate.subject, variables)}
                      </div>
                    )}
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {testMode === 'template' && selectedTemplate
                      ? processContent(selectedTemplate.content, variables)
                      : customContent
                    }
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={sendTestMessage} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes</CardTitle>
            <CardDescription>
              Histórico de mensagens de teste enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TestTube className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum teste realizado ainda</p>
                <p className="text-sm">Envie sua primeira mensagem de teste</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {testResults.map((result) => (
                  <div key={result.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                        <Badge variant="outline">
                          {result.type.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div><strong>Template:</strong> {result.template}</div>
                      <div><strong>Destinatário:</strong> {result.recipient}</div>
                      {result.message && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {result.message}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          <strong>Importante:</strong> Para que o sistema de testes funcione completamente, 
          certifique-se de que as chaves API dos provedores SMS e Email estão configuradas 
          nas definições do sistema. As mensagens de teste são enviadas através dos mesmos 
          canais que as mensagens reais.
        </AlertDescription>
      </Alert>
    </div>
  );
}