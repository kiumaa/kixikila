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
  Clock,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SMSConfig {
  senderId?: string;
  brandName?: string;
  allowedCountries?: string[];
  templates?: {
    verification?: string;
    login?: string;
  };
  rateLimits?: {
    perPhone?: number;
    global?: number;
  };
  otpExpiry?: number;
  security?: {
    blockInternational?: boolean;
    enableBlacklist?: boolean;
    requirePhoneVerification?: boolean;
  };
  delivery?: {
    allowedTimeStart?: string;
    allowedTimeEnd?: string;
    maxRetries?: number;
    allowedDays?: number[];
  };
}

const AdvancedSystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('system');
  const [smsConfig, setSmsConfig] = useState<SMSConfig>({
    senderId: 'KB Agency',
    brandName: 'KIXIKILA',
    allowedCountries: ['PT', 'BR'],
    templates: {
      verification: '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.',
      login: '{{brandName}}: Código de login: {{code}}. Se não foi você, ignore esta mensagem.'
    },
    rateLimits: {
      perPhone: 5,
      global: 100
    },
    otpExpiry: 10,
    security: {
      blockInternational: false,
      enableBlacklist: false,
      requirePhoneVerification: true
    },
    delivery: {
      allowedTimeStart: '08:00',
      allowedTimeEnd: '22:00',
      maxRetries: 3,
      allowedDays: [0, 1, 2, 3, 4, 5, 6]
    }
  });
  const [testPhone, setTestPhone] = useState('');

  const handleTestSMS = async () => {
    if (!testPhone) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp-sms', {
        body: {
          phone: testPhone,
          type: 'phone_verification'
        }
      });

      if (error) {
        toast({
          title: 'Erro no teste',
          description: 'Falha ao enviar SMS de teste',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Teste enviado',
          description: 'SMS de teste enviado com sucesso!'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao conectar ao serviço SMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSMSConfig = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('manage-system-config', {
        body: {
          action: 'update_sms_configuration',
          config: smsConfig
        }
      });

      if (error) {
        toast({
          title: 'Erro ao salvar',
          description: 'Falha ao salvar configurações SMS',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Configurações salvas',
          description: 'Configurações SMS atualizadas com sucesso!'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar configurações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
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
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações avançadas do sistema em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs with placeholder content */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates de Mensagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Gestão de templates em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-6">
          {/* Sender ID & Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Sender ID & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="senderId">Sender ID</Label>
                  <Input
                    id="senderId"
                    value={smsConfig.senderId || ''}
                    onChange={(e) => setSmsConfig({...smsConfig, senderId: e.target.value})}
                    placeholder="KB Agency"
                    maxLength={11}
                  />
                  <p className="text-xs text-muted-foreground">Máximo 11 caracteres alfanuméricos</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brandName">Nome da Marca</Label>
                  <Input
                    id="brandName"
                    value={smsConfig.brandName || ''}
                    onChange={(e) => setSmsConfig({...smsConfig, brandName: e.target.value})}
                    placeholder="KIXIKILA"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Países Permitidos</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    🇵🇹 Portugal
                    <X className="w-3 h-3 cursor-pointer" />
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    🇧🇷 Brasil
                    <X className="w-3 h-3 cursor-pointer" />
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar País
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom OTP Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Templates de OTP Personalizados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="verificationTemplate">Template de Verificação</Label>
                    <Textarea
                      id="verificationTemplate"
                      value={smsConfig.templates?.verification || ''}
                      onChange={(e) => setSmsConfig({
                        ...smsConfig,
                        templates: {
                          ...smsConfig.templates,
                          verification: e.target.value
                        }
                      })}
                      placeholder="{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loginTemplate">Template de Login</Label>
                    <Textarea
                      id="loginTemplate"
                      value={smsConfig.templates?.login || ''}
                      onChange={(e) => setSmsConfig({
                        ...smsConfig,
                        templates: {
                          ...smsConfig.templates,
                          login: e.target.value
                        }
                      })}
                      placeholder="{{brandName}}: Código de login: {{code}}. Se não foi você, ignore esta mensagem."
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Variáveis Disponíveis</Label>
                    <div className="flex flex-wrap gap-2">
                      {['{{brandName}}', '{{code}}', '{{minutes}}', '{{userName}}', '{{phone}}'].map(variable => (
                        <Badge key={variable} variant="outline" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <Label>Preview da Mensagem</Label>
                  <div className="bg-muted p-4 rounded-lg border">
                    <div className="text-sm font-medium mb-2">Verificação:</div>
                    <div className="bg-background p-3 rounded border text-sm font-mono">
                      {smsConfig.templates?.verification?.replace('{{brandName}}', smsConfig.brandName || 'KIXIKILA')
                        .replace('{{code}}', '123456')
                        .replace('{{minutes}}', '10') || 'Template não definido'}
                    </div>
                    <div className="text-sm font-medium mt-4 mb-2">Login:</div>
                    <div className="bg-background p-3 rounded border text-sm font-mono">
                      {smsConfig.templates?.login?.replace('{{brandName}}', smsConfig.brandName || 'KIXIKILA')
                        .replace('{{code}}', '123456') || 'Template não definido'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p>• Máximo 160 caracteres por mensagem</p>
                    <p>• Caracteres especiais podem afetar o limite</p>
                    <p>• Use variáveis para personalização</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security & Rate Limiting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança & Rate Limiting
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxSmsPerPhone">SMS por Número/Hora</Label>
                  <Input
                    id="maxSmsPerPhone"
                    type="number"
                    value={smsConfig.rateLimits?.perPhone || 5}
                    onChange={(e) => setSmsConfig({
                      ...smsConfig,
                      rateLimits: {
                        ...smsConfig.rateLimits,
                        perPhone: parseInt(e.target.value)
                      }
                    })}
                    min="1"
                    max="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxSmsGlobal">SMS Globais/Minuto</Label>
                  <Input
                    id="maxSmsGlobal"
                    type="number"
                    value={smsConfig.rateLimits?.global || 100}
                    onChange={(e) => setSmsConfig({
                      ...smsConfig,
                      rateLimits: {
                        ...smsConfig.rateLimits,
                        global: parseInt(e.target.value)
                      }
                    })}
                    min="10"
                    max="1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="otpExpiry">Validade OTP (min)</Label>
                  <Input
                    id="otpExpiry"
                    type="number"
                    value={smsConfig.otpExpiry || 10}
                    onChange={(e) => setSmsConfig({...smsConfig, otpExpiry: parseInt(e.target.value)})}
                    min="1"
                    max="60"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="blockInternational"
                    checked={smsConfig.security?.blockInternational || false}
                    onCheckedChange={(checked) => setSmsConfig({
                      ...smsConfig,
                      security: {
                        ...smsConfig.security,
                        blockInternational: checked
                      }
                    })}
                  />
                  <Label htmlFor="blockInternational">Bloquear números internacionais</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableBlacklist"
                    checked={smsConfig.security?.enableBlacklist || false}
                    onCheckedChange={(checked) => setSmsConfig({
                      ...smsConfig,
                      security: {
                        ...smsConfig.security,
                        enableBlacklist: checked
                      }
                    })}
                  />
                  <Label htmlFor="enableBlacklist">Ativar lista de bloqueio</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="requirePhoneVerification"
                    checked={smsConfig.security?.requirePhoneVerification || true}
                    onCheckedChange={(checked) => setSmsConfig({
                      ...smsConfig,
                      security: {
                        ...smsConfig.security,
                        requirePhoneVerification: checked
                      }
                    })}
                  />
                  <Label htmlFor="requirePhoneVerification">Exigir verificação de número</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Configurações de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário de Envio Permitido</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={smsConfig.delivery?.allowedTimeStart || '08:00'}
                      onChange={(e) => setSmsConfig({
                        ...smsConfig,
                        delivery: {
                          ...smsConfig.delivery,
                          allowedTimeStart: e.target.value
                        }
                      })}
                    />
                    <span className="text-muted-foreground">às</span>
                    <Input
                      type="time"
                      value={smsConfig.delivery?.allowedTimeEnd || '22:00'}
                      onChange={(e) => setSmsConfig({
                        ...smsConfig,
                        delivery: {
                          ...smsConfig.delivery,
                          allowedTimeEnd: e.target.value
                        }
                      })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxRetries">Tentativas de Reenvio</Label>
                  <Select
                    value={smsConfig.delivery?.maxRetries?.toString() || '3'}
                    onValueChange={(value) => setSmsConfig({
                      ...smsConfig,
                      delivery: {
                        ...smsConfig.delivery,
                        maxRetries: parseInt(value)
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem reenvio</SelectItem>
                      <SelectItem value="1">1 tentativa</SelectItem>
                      <SelectItem value="3">3 tentativas</SelectItem>
                      <SelectItem value="5">5 tentativas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Dias da Semana Permitidos</Label>
                <div className="flex flex-wrap gap-2">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
                    <Badge
                      key={day}
                      variant={smsConfig.delivery?.allowedDays?.includes(index) ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => {
                        const currentDays = smsConfig.delivery?.allowedDays || [0,1,2,3,4,5,6];
                        const newDays = currentDays.includes(index)
                          ? currentDays.filter(d => d !== index)
                          : [...currentDays, index];
                        setSmsConfig({
                          ...smsConfig,
                          delivery: {
                            ...smsConfig.delivery,
                            allowedDays: newDays
                          }
                        });
                      }}
                    >
                      {day}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="w-5 h-5" />
                Teste & Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label htmlFor="testPhone">Testar Envio de SMS</Label>
                  <div className="flex gap-2">
                    <Input
                      id="testPhone"
                      placeholder="+351912345678"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                    <Button
                      onClick={handleTestSMS}
                      disabled={loading || !testPhone}
                      size="sm"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                      Testar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Status do Serviço</Label>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm">BulkSMS conectado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Última verificação: há 2 min</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">1,234</div>
                  <div className="text-xs text-muted-foreground">SMS Enviados (24h)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">98.5%</div>
                  <div className="text-xs text-muted-foreground">Taxa de Sucesso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">2.3s</div>
                  <div className="text-xs text-muted-foreground">Tempo Médio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">€45.67</div>
                  <div className="text-xs text-muted-foreground">Custo (mês)</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveSMSConfig}
              disabled={loading}
              className="min-w-32"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Guardar Configurações
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Configurações de Segurança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações de segurança em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Configurações de Notificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações de notificações em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5" />
                Configurações de Webhooks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Configurações de webhooks em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSystemSettings;
