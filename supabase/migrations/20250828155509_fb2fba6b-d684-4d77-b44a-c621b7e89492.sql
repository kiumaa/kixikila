-- Create bulk_campaigns table
CREATE TABLE IF NOT EXISTS public.bulk_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'completed', 'paused', 'failed')),
  template_id UUID REFERENCES public.message_templates(id),
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'vip', 'inactive', 'custom')),
  filters JSONB DEFAULT '{}',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create message_logs table for tracking individual messages
CREATE TABLE IF NOT EXISTS public.message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
  recipient TEXT NOT NULL,
  template_id UUID REFERENCES public.message_templates(id),
  campaign_id UUID REFERENCES public.bulk_campaigns(id),
  content TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  error_message TEXT,
  external_id TEXT, -- ID from external service (BulkSMS, Resend, etc.)
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bulk_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_campaigns
CREATE POLICY "Admins can access all bulk campaigns"
ON public.bulk_campaigns
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Users can view their own campaigns"
ON public.bulk_campaigns
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

-- RLS Policies for message_logs
CREATE POLICY "Admins can access all message logs"
ON public.message_logs
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "Service role can insert message logs"
ON public.message_logs
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update message logs"
ON public.message_logs
FOR UPDATE
TO service_role
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_bulk_campaigns_status ON public.bulk_campaigns(status);
CREATE INDEX idx_bulk_campaigns_type ON public.bulk_campaigns(type);
CREATE INDEX idx_bulk_campaigns_created_by ON public.bulk_campaigns(created_by);
CREATE INDEX idx_bulk_campaigns_scheduled_at ON public.bulk_campaigns(scheduled_at) WHERE scheduled_at IS NOT NULL;

CREATE INDEX idx_message_logs_campaign_id ON public.message_logs(campaign_id);
CREATE INDEX idx_message_logs_status ON public.message_logs(status);
CREATE INDEX idx_message_logs_type ON public.message_logs(type);
CREATE INDEX idx_message_logs_recipient ON public.message_logs(recipient);
CREATE INDEX idx_message_logs_sent_at ON public.message_logs(sent_at);

-- Create trigger for updated_at
CREATE TRIGGER update_bulk_campaigns_updated_at
  BEFORE UPDATE ON public.bulk_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_logs_updated_at
  BEFORE UPDATE ON public.message_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default message templates
INSERT INTO public.message_templates (name, type, category, subject, content, language, is_default, is_active, variables, version) VALUES
('OTP SMS', 'sms', 'otp', NULL, 'O seu código de verificação KIXIKILA é: {otp_code}. Válido por 10 minutos. Não partilhe este código.', 'pt', true, true, '["otp_code"]', 1),
('Boas-vindas Email', 'email', 'welcome', 'Bem-vindo ao KIXIKILA!', 'Olá {user.name}!\n\nBem-vindo à plataforma KIXIKILA! Estamos felizes por ter juntado à nossa comunidade de poupança colaborativa.\n\nCom o KIXIKILA pode:\n- Criar grupos de poupança\n- Participar em sorteios\n- Alcançar os seus objetivos financeiros\n\nComece já a poupar!\n\nEquipa KIXIKILA', 'pt', true, true, '["user.name"]', 1),
('Lembrete Pagamento SMS', 'sms', 'reminder', NULL, 'Olá {user.name}! Lembrete: o seu pagamento para o grupo "{group.name}" vence amanhã. Valor: {amount}. Pague através da app KIXIKILA.', 'pt', true, true, '["user.name", "group.name", "amount"]', 1),
('Notificação Prémio Email', 'email', 'notification', 'Parabéns! Foi contemplado no sorteio', 'Parabéns {user.name}!\n\nTem excelentes notícias! Foi o contemplado no sorteio do grupo "{group.name}".\n\nValor a receber: {amount}\nData do sorteio: {date}\n\nO valor será creditado na sua carteira KIXIKILA nos próximos minutos.\n\nContinue a poupar connosco!\n\nEquipa KIXIKILA', 'pt', true, true, '["user.name", "group.name", "amount", "date"]', 1),
('Promoção Marketing Email', 'email', 'marketing', 'Oferta Especial KIXIKILA - {offer.title}', 'Olá {user.name}!\n\nTemos uma oferta especial para si!\n\n🎉 {offer.title}\n{offer.description}\n\nEsta oferta é válida até {offer.expires_date}.\n\nNão perca esta oportunidade!\n\nEquipa KIXIKILA', 'pt', false, true, '["user.name", "offer.title", "offer.description", "offer.expires_date"]', 1)
ON CONFLICT (name) DO NOTHING;