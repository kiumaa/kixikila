import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  MessageSquare, 
  Shield, 
  Bell, 
  Webhook, 
  Server, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SystemConfig {
  config_key: string;
  config_value: any;
  config_type: string;
  description: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push_notification';
  category: 'otp' | 'welcome' | 'notification' | 'security' | 'transaction' | 'reminder';
  subject?: string;
  content: string;
  variables: string[];
  is_active: boolean;
  language: string;
}

interface SMSConfig {
  sender_id: string;
  rate_limit_per_number: number;
  rate_limit_window_minutes: number;
  allowed_countries: string[];
  blacklisted_numbers: string[];
  timeout_seconds: number;
  max_attempts: number;
}

interface SecurityConfig {
  ip_blacklist: string[];
  rate_limit_login: number;
  rate_limit_api: number;
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_symbols: boolean;
  session_timeout_minutes: number;
  two_factor_required: boolean;
}

interface NotificationConfig {
  push_notifications_enabled: boolean;
  email_notifications_enabled: boolean;
  sms_notifications_enabled: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string;
  quiet_hours_end: string;
  weekend_notifications: boolean;
  max_notifications_per_day: number;
  fcm_server_key: string;
}

interface Webhook {
  id?: string;
  name: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret_key: string;
  retry_attempts: number;
  timeout_seconds: number;
}

interface ServiceHealth {
  service_name: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms: number;
  error_message?: string;
  last_check: string;
}

const AdvancedSystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  
  // System configurations
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  
  // Templates
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  
  // SMS configuration
  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    sender_id: 'KIXIKILA',
    rate_limit_per_number: 5,
    rate_limit_window_minutes: 60,
    allowed_countries: ['244'],
    blacklisted_numbers: [],
    timeout_seconds: 300,
    max_attempts: 3
  });
  
  // Security configuration
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>({
    ip_blacklist: [],
    rate_limit_login: 5,
    rate_limit_api: 100,
    password_min_length: 8,
    password_require_uppercase: true,
    password_require_lowercase: true,
    password_require_numbers: true,
    password_require_symbols: false,
    session_timeout_minutes: 1440,
    two_factor_required: false
  });
  
  // Notification configuration
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({
    push_notifications_enabled: true,
    email_notifications_enabled: true,
    sms_notifications_enabled: true,
    notification_frequency: 'immediate',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    weekend_notifications: true,
    max_notifications_per_day: 50,
    fcm_server_key: ''
  });
  
  // Webhooks
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  
  // Service health
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [checkingHealth, setCheckingHealth] = useState(false);
  
  // Template preview
  const [previewData, setPreviewData] = useState<any>({
    user_name: 'João Silva',
    otp_code: '123456',
    activity_description: 'Login suspeito'
  });

  useEffect(() => {
    loadAllConfigurations();
  }, []);

  const loadAllConfigurations = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSystemConfigurations(),
        loadTemplates(),
        loadSMSConfiguration(),
        loadSecurityConfiguration(),
        loadNotificationConfiguration(),
        loadWebhooks(),
        loadServiceHealth()
      ]);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSystemConfigurations = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_all_configs' }
    });
    
    if (error) throw error;
    if (data?.success) {
      setSystemConfigs(data.data);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_templates' }
    });
    
    if (error) throw error;
    if (data?.success) {
      setTemplates(data.data);
    }
  };

  const loadSMSConfiguration = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_sms_config' }
    });
    
    if (error) throw error;
    if (data?.success && data.data) {
      setSmsConfig(prev => ({ ...prev, ...data.data }));
    }
  };

  const loadSecurityConfiguration = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_security_config' }
    });
    
    if (error) throw error;
    if (data?.success && data.data) {
      setSecurityConfig(prev => ({ ...prev, ...data.data }));
    }
  };

  const loadNotificationConfiguration = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_notification_config' }
    });
    
    if (error) throw error;
    if (data?.success && data.data) {
      setNotificationConfig(prev => ({ ...prev, ...data.data }));
    }
  };

  const loadWebhooks = async () => {
    const { data, error } = await supabase.functions.invoke('manage-system-config', {
      body: { action: 'get_webhooks' }
    });
    
    if (error) throw error;
    if (data?.success) {
      setWebhooks(data.data);
    }
  };

  const loadServiceHealth = async () => {
    const { data, error } = await supabase.functions.invoke('service-health-monitor', {
      body: { action: 'get_service_status' }
    });
    
    if (error) throw error;
    if (data?.success) {
      setServiceHealth(data.data);
    }
  };

  const checkAllServices = async () => {
    setCheckingHealth(true);
    try {
      const { data, error } = await supabase.functions.invoke('service-health-monitor', {
        body: { action: 'check_all_services' }
      });
      
      if (error) throw error;
      if (data?.success) {
        setServiceHealth(data.data);
        toast({
          title: 'Sucesso',
          description: 'Verificação de serviços concluída'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao verificar serviços',
        variant: 'destructive'
      });
    } finally {
      setCheckingHealth(false);
    }
  };

  const updateSystemConfiguration = async (config_key: string, config_value: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { 
          action: 'update_system_config',
          config_key,
          config_value,
          config_type: 'system'
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: 'Configuração atualizada com sucesso'
      });
      
      await loadSystemConfigurations();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar configuração',
        variant: 'destructive'
      });
    }
  };

  const saveTemplate = async (template: Partial<MessageTemplate>) => {
    try {
      const action = template.id ? 'update_template' : 'create_template';
      
      const { data, error } = await supabase.functions.invoke('manage-system-config', {
        body: { action, ...template }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Sucesso',
        description: `Template ${template.id ? 'atualizado' : 'criado'} com sucesso`
      });
      
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar template',
        variant: 'destructive'
      });
    }
  };

  const renderPreview = (content: string) => {
    let preview = content;
    Object.entries(previewData).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, 'g'), value as string);
    });
    return preview;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'down': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Configurações Avançadas</h2>
        <p className="text-muted-foreground">Configurações completas do sistema, templates e integrações</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="flex items-center gap-2">
            <Webhook className="w-4 h-4" />
            Webhooks
          </TabsTrigger>
        </TabsList>

        {/* System Configuration Tab */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemConfigs.map((config) => (
                <div key={config.config_key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{config.config_key.replace(/_/g, ' ').toUpperCase()}</h4>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {typeof config.config_value.enabled === 'boolean' ? (
                      <Switch
                        checked={config.config_value.enabled}
                        onCheckedChange={(enabled) => 
                          updateSystemConfiguration(config.config_key, { ...config.config_value, enabled })
                        }
                      />
                    ) : (
                      <Badge variant="outline">
                        {JSON.stringify(config.config_value)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Service Health Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Status dos Serviços
                </div>
                <Button
                  onClick={checkAllServices}
                  disabled={checkingHealth}
                  size="sm"
                  variant="outline"
                >
                  {checkingHealth ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Verificar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceHealth.map((service) => (
                  <div key={service.service_name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h4 className="font-medium capitalize">{service.service_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {service.response_time_ms}ms
                        </p>
                      </div>
                    </div>
                    <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'}>
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Templates de Mensagens
                </div>
                <Button
                  onClick={() => {
                    setEditingTemplate({
                      id: '',
                      name: '',
                      type: 'email',
                      category: 'notification',
                      subject: '',
                      content: '',
                      variables: [],
                      is_active: true,
                      language: 'pt'
                    });
                    setShowTemplateEditor(true);
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Template
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge variant="outline">{template.type}</Badge>
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.is_active && <Badge variant="default">Ativo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.subject && `${template.subject}: `}
                        {template.content.substring(0, 100)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => {
                          setEditingTemplate(template);
                          setShowTemplateEditor(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Template Editor Modal */}
          {showTemplateEditor && editingTemplate && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle>
                    {editingTemplate.id ? 'Editar Template' : 'Novo Template'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nome do Template</Label>
                      <Input
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate(prev => 
                          prev ? { ...prev, name: e.target.value } : null
                        )}
                        placeholder="Nome do template"
                      />
                    </div>
                    
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={editingTemplate.type}
                        onValueChange={(value) => setEditingTemplate(prev => 
                          prev ? { ...prev, type: value as any } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="push_notification">Push Notification</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={editingTemplate.category}
                        onValueChange={(value) => setEditingTemplate(prev => 
                          prev ? { ...prev, category: value as any } : null
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="otp">OTP</SelectItem>
                          <SelectItem value="welcome">Welcome</SelectItem>
                          <SelectItem value="notification">Notification</SelectItem>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="transaction">Transaction</SelectItem>
                          <SelectItem value="reminder">Reminder</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingTemplate.is_active}
                        onCheckedChange={(checked) => setEditingTemplate(prev => 
                          prev ? { ...prev, is_active: checked } : null
                        )}
                      />
                      <Label>Template Ativo</Label>
                    </div>
                  </div>

                  {editingTemplate.type === 'email' && (
                    <div>
                      <Label>Assunto (Email)</Label>
                      <Input
                        value={editingTemplate.subject || ''}
                        onChange={(e) => setEditingTemplate(prev => 
                          prev ? { ...prev, subject: e.target.value } : null
                        )}
                        placeholder="Assunto do email"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Conteúdo</Label>
                      <Textarea
                        value={editingTemplate.content}
                        onChange={(e) => setEditingTemplate(prev => 
                          prev ? { ...prev, content: e.target.value } : null
                        )}
                        placeholder="Conteúdo da mensagem (use {{variavel}} para variáveis)"
                        rows={8}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Variáveis disponíveis: user_name, otp_code, activity_description, etc.
                      </p>
                    </div>
                    
                    <div>
                      <Label>Preview</Label>
                      <div className="p-3 border rounded-lg bg-muted min-h-[200px]">
                        {editingTemplate.type === 'email' ? (
                          <div>
                            <div className="font-semibold mb-2">
                              Assunto: {renderPreview(editingTemplate.subject || '')}
                            </div>
                            <div dangerouslySetInnerHTML={{ __html: renderPreview(editingTemplate.content) }} />
                          </div>
                        ) : (
                          <div>{renderPreview(editingTemplate.content)}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTemplateEditor(false);
                        setEditingTemplate(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button onClick={() => saveTemplate(editingTemplate)}>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* SMS Configuration Tab */}
        <TabsContent value="sms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Configurações Avançadas de SMS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Sender ID</Label>
                  <Input
                    value={smsConfig.sender_id}
                    onChange={(e) => setSmsConfig(prev => ({ ...prev, sender_id: e.target.value }))}
                    placeholder="KIXIKILA"
                  />
                </div>
                
                <div>
                  <Label>Rate Limit por Número</Label>
                  <Input
                    type="number"
                    value={smsConfig.rate_limit_per_number}
                    onChange={(e) => setSmsConfig(prev => ({ ...prev, rate_limit_per_number: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Janela de Rate Limit (minutos)</Label>
                  <Input
                    type="number"
                    value={smsConfig.rate_limit_window_minutes}
                    onChange={(e) => setSmsConfig(prev => ({ ...prev, rate_limit_window_minutes: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Timeout (segundos)</Label>
                  <Input
                    type="number"
                    value={smsConfig.timeout_seconds}
                    onChange={(e) => setSmsConfig(prev => ({ ...prev, timeout_seconds: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div>
                <Label>Países Permitidos (códigos)</Label>
                <Input
                  value={smsConfig.allowed_countries.join(', ')}
                  onChange={(e) => setSmsConfig(prev => ({ 
                    ...prev, 
                    allowed_countries: e.target.value.split(',').map(c => c.trim()) 
                  }))}
                  placeholder="244, 351, 55"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    supabase.functions.invoke('manage-system-config', {
                      body: { action: 'update_sms_config', ...smsConfig }
                    });
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações SMS
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Configuration Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Rate Limit Login</Label>
                  <Input
                    type="number"
                    value={securityConfig.rate_limit_login}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, rate_limit_login: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Comprimento Mínimo da Senha</Label>
                  <Input
                    type="number"
                    value={securityConfig.password_min_length}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, password_min_length: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Timeout da Sessão (minutos)</Label>
                  <Input
                    type="number"
                    value={securityConfig.session_timeout_minutes}
                    onChange={(e) => setSecurityConfig(prev => ({ ...prev, session_timeout_minutes: parseInt(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Políticas de Senha</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securityConfig.password_require_uppercase}
                      onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, password_require_uppercase: checked }))}
                    />
                    <Label>Maiúsculas Obrigatórias</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securityConfig.password_require_lowercase}
                      onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, password_require_lowercase: checked }))}
                    />
                    <Label>Minúsculas Obrigatórias</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securityConfig.password_require_numbers}
                      onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, password_require_numbers: checked }))}
                    />
                    <Label>Números Obrigatórios</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={securityConfig.two_factor_required}
                      onCheckedChange={(checked) => setSecurityConfig(prev => ({ ...prev, two_factor_required: checked }))}
                    />
                    <Label>2FA Obrigatório</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    supabase.functions.invoke('manage-system-config', {
                      body: { action: 'update_security_config', ...securityConfig }
                    });
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações de Segurança
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Configuration Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationConfig.push_notifications_enabled}
                    onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, push_notifications_enabled: checked }))}
                  />
                  <Label>Push Notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationConfig.email_notifications_enabled}
                    onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, email_notifications_enabled: checked }))}
                  />
                  <Label>Email Notifications</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={notificationConfig.sms_notifications_enabled}
                    onCheckedChange={(checked) => setNotificationConfig(prev => ({ ...prev, sms_notifications_enabled: checked }))}
                  />
                  <Label>SMS Notifications</Label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Frequência de Notificações</Label>
                  <Select
                    value={notificationConfig.notification_frequency}
                    onValueChange={(value) => setNotificationConfig(prev => ({ ...prev, notification_frequency: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Imediata</SelectItem>
                      <SelectItem value="hourly">Horária</SelectItem>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Máx. Notificações/Dia</Label>
                  <Input
                    type="number"
                    value={notificationConfig.max_notifications_per_day}
                    onChange={(e) => setNotificationConfig(prev => ({ ...prev, max_notifications_per_day: parseInt(e.target.value) }))}
                  />
                </div>
                
                <div>
                  <Label>Início do Silêncio</Label>
                  <Input
                    type="time"
                    value={notificationConfig.quiet_hours_start}
                    onChange={(e) => setNotificationConfig(prev => ({ ...prev, quiet_hours_start: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label>Fim do Silêncio</Label>
                  <Input
                    type="time"
                    value={notificationConfig.quiet_hours_end}
                    onChange={(e) => setNotificationConfig(prev => ({ ...prev, quiet_hours_end: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label>FCM Server Key</Label>
                <Input
                  type="password"
                  value={notificationConfig.fcm_server_key}
                  onChange={(e) => setNotificationConfig(prev => ({ ...prev, fcm_server_key: e.target.value }))}
                  placeholder="Chave do servidor FCM para push notifications"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => {
                    supabase.functions.invoke('manage-system-config', {
                      body: { action: 'update_notification_config', ...notificationConfig }
                    });
                  }}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações de Notificações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Webhook className="w-5 h-5" />
                  Webhooks
                </div>
                <Button
                  onClick={() => {
                    setEditingWebhook({
                      name: '',
                      url: '',
                      events: [],
                      is_active: true,
                      secret_key: '',
                      retry_attempts: 3,
                      timeout_seconds: 30
                    });
                  }}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Webhook
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{webhook.name}</h4>
                      <p className="text-sm text-muted-foreground">{webhook.url}</p>
                      <div className="flex gap-1 mt-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={webhook.is_active ? 'default' : 'secondary'}>
                        {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button
                        onClick={() => setEditingWebhook(webhook)}
                        size="sm"
                        variant="outline"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => {
                          supabase.functions.invoke('manage-system-config', {
                            body: { action: 'delete_webhook', id: webhook.id }
                          }).then(() => loadWebhooks());
                        }}
                        size="sm"
                        variant="destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSystemSettings;