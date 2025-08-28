import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Key, Database, Save, Mail, MessageSquare, CreditCard, TestTube, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { adminApi, type ApiResponse } from '@/services/api';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  hasPassword?: boolean;
}

interface StripeConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  hasSecretKey?: boolean;
  hasPublicKey?: boolean;
  hasWebhookSecret?: boolean;
}

interface BulkSMSConfig {
  tokenId: string;
  tokenSecret: string;
  hasTokenId?: boolean;
  hasTokenSecret?: boolean;
}

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  
  // Email configuration state
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromName: 'KIXIKILA',
    fromAddress: ''
  });
  
  // Stripe configuration state
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>({
    secretKey: '',
    publicKey: '',
    webhookSecret: ''
  });
  
  // BulkSMS configuration state
  const [bulkSMSConfig, setBulkSMSConfig] = useState<BulkSMSConfig>({
    tokenId: '',
    tokenSecret: ''
  });
  
  // Test email/phone
  const [testEmail, setTestEmail] = useState('');
  const [testPhone, setTestPhone] = useState('');

  // Load configurations on component mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      setLoading(true);
      
      // Load email config
      const emailResponse = await adminApi.getEmailConfig();
      if (emailResponse.success) {
        setEmailConfig(prev => ({ ...prev, ...emailResponse.data }));
      }
      
      // Load Stripe config
      const stripeResponse = await adminApi.getStripeConfig();
      if (stripeResponse.success) {
        setStripeConfig(prev => ({ ...prev, ...stripeResponse.data }));
      }
      
      // Load BulkSMS config
      const bulkSMSResponse = await adminApi.getBulkSMSConfig();
      if (bulkSMSResponse.success) {
        setBulkSMSConfig(prev => ({ ...prev, ...bulkSMSResponse.data }));
      }
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

  const handleSaveEmailConfig = async () => {
    try {
      setLoading(true);
      const response = await adminApi.updateEmailConfig(emailConfig);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Configuração de email salva com sucesso'
        });
        await loadConfigurations();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar configuração de email',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um email para teste',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTestingEmail(true);
      const response = await adminApi.testEmailConfig(testEmail);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Email de teste enviado com sucesso'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao enviar email de teste',
        variant: 'destructive'
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSaveStripeConfig = async () => {
    try {
      setLoading(true);
      const response = await adminApi.updateStripeConfig(stripeConfig);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Configuração do Stripe salva com sucesso'
        });
        await loadConfigurations();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar configuração do Stripe',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBulkSMSConfig = async () => {
    try {
      setLoading(true);
      const response = await adminApi.updateBulkSMSConfig(bulkSMSConfig);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Configuração do BulkSMS salva com sucesso'
        });
        await loadConfigurations();
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao salvar configuração do BulkSMS',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestSMS = async () => {
    if (!testPhone) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um número de telefone para teste',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTestingSMS(true);
      const response = await adminApi.testBulkSMSConfig(testPhone);
      
      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'SMS de teste enviado com sucesso'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.response?.data?.message || 'Erro ao enviar SMS de teste',
        variant: 'destructive'
      });
    } finally {
      setTestingSMS(false);
    }
  };

  if (loading && !emailConfig.host) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h2>
        <p className="text-gray-600">Configure integrações e chaves de API</p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="stripe" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger value="sms" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            SMS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Configuração de Email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-host">Servidor SMTP</Label>
                  <Input
                    id="email-host"
                    value={emailConfig.host}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, host: e.target.value }))}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-port">Porta</Label>
                  <Input
                    id="email-port"
                    type="number"
                    value={emailConfig.port}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, port: parseInt(e.target.value) || 587 }))}
                    placeholder="587"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-secure"
                  checked={emailConfig.secure}
                  onCheckedChange={(checked) => setEmailConfig(prev => ({ ...prev, secure: checked }))}
                />
                <Label htmlFor="email-secure">Conexão segura (SSL/TLS)</Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-user">Usuário/Email</Label>
                  <Input
                    id="email-user"
                    type="email"
                    value={emailConfig.user}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="seu-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">Senha/Token</Label>
                  <Input
                    id="email-password"
                    type="password"
                    value={emailConfig.password}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={emailConfig.hasPassword ? "••••••••" : "Sua senha ou token"}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email-from-name">Nome do Remetente</Label>
                  <Input
                    id="email-from-name"
                    value={emailConfig.fromName}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="KIXIKILA"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-from-address">Email do Remetente</Label>
                  <Input
                    id="email-from-address"
                    type="email"
                    value={emailConfig.fromAddress}
                    onChange={(e) => setEmailConfig(prev => ({ ...prev, fromAddress: e.target.value }))}
                    placeholder="noreply@kixikila.com"
                  />
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Testar Configuração</h4>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="email-para-teste@exemplo.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestEmail}
                    disabled={testingEmail}
                    variant="outline"
                  >
                    {testingEmail ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveEmailConfig} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stripe">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Configuração do Stripe
                {stripeConfig.hasSecretKey && stripeConfig.hasPublicKey && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Key className="w-4 h-4" />
                <AlertDescription>
                  Configure suas chaves do Stripe para processar pagamentos. Mantenha suas chaves secretas seguras.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="stripe-public">Chave Pública</Label>
                  <Input
                    id="stripe-public"
                    value={stripeConfig.publicKey}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, publicKey: e.target.value }))}
                    placeholder="pk_test_..."
                  />
                  {stripeConfig.hasPublicKey && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Chave pública configurada
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-secret">Chave Secreta</Label>
                  <Input
                    id="stripe-secret"
                    type="password"
                    value={stripeConfig.secretKey}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder={stripeConfig.hasSecretKey ? "••••••••" : "sk_test_..."}
                  />
                  {stripeConfig.hasSecretKey && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Chave secreta configurada
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="stripe-webhook">Webhook Secret</Label>
                  <Input
                    id="stripe-webhook"
                    type="password"
                    value={stripeConfig.webhookSecret}
                    onChange={(e) => setStripeConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder={stripeConfig.hasWebhookSecret ? "••••••••" : "whsec_..."}
                  />
                  {stripeConfig.hasWebhookSecret && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Webhook secret configurado
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveStripeConfig} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Configuração de SMS (BulkSMS)
                {bulkSMSConfig.hasTokenId && bulkSMSConfig.hasTokenSecret && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <MessageSquare className="w-4 h-4" />
                <AlertDescription>
                  Configure suas credenciais do BulkSMS para enviar mensagens de texto.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-id">Token ID</Label>
                  <Input
                    id="bulksms-token-id"
                    value={bulkSMSConfig.tokenId}
                    onChange={(e) => setBulkSMSConfig(prev => ({ ...prev, tokenId: e.target.value }))}
                    placeholder={bulkSMSConfig.hasTokenId ? "••••••••" : "Seu Token ID"}
                  />
                  {bulkSMSConfig.hasTokenId && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Token ID configurado
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bulksms-token-secret">Token Secret</Label>
                  <Input
                    id="bulksms-token-secret"
                    type="password"
                    value={bulkSMSConfig.tokenSecret}
                    onChange={(e) => setBulkSMSConfig(prev => ({ ...prev, tokenSecret: e.target.value }))}
                    placeholder={bulkSMSConfig.hasTokenSecret ? "••••••••" : "Seu Token Secret"}
                  />
                  {bulkSMSConfig.hasTokenSecret && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Token Secret configurado
                    </p>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Testar Configuração</h4>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+244900000000"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleTestSMS}
                    disabled={testingSMS}
                    variant="outline"
                  >
                    {testingSMS ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Testar
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveBulkSMSConfig} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;