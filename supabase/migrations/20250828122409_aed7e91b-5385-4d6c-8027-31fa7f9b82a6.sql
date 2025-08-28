-- Create comprehensive system settings tables

-- System configurations table
CREATE TABLE public.system_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  config_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Templates table for emails, SMS, notifications
CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push_notification')),
  category TEXT NOT NULL CHECK (category IN ('otp', 'welcome', 'notification', 'security', 'transaction', 'reminder')),
  language TEXT NOT NULL DEFAULT 'pt',
  subject TEXT, -- For emails
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]', -- Available variables for template
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- SMS advanced configurations
CREATE TABLE public.sms_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT,
  default_template_otp UUID REFERENCES public.message_templates(id),
  default_template_notification UUID REFERENCES public.message_templates(id),
  rate_limit_per_number INTEGER DEFAULT 5,
  rate_limit_window_minutes INTEGER DEFAULT 60,
  allowed_countries TEXT[] DEFAULT ARRAY['244'], -- Angola by default
  blacklisted_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],
  timeout_seconds INTEGER DEFAULT 300, -- 5 minutes
  max_attempts INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Email advanced configurations  
CREATE TABLE public.email_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_welcome UUID REFERENCES public.message_templates(id),
  template_otp UUID REFERENCES public.message_templates(id),
  template_password_reset UUID REFERENCES public.message_templates(id),
  template_notification UUID REFERENCES public.message_templates(id),
  rate_limit_per_email INTEGER DEFAULT 10,
  rate_limit_window_minutes INTEGER DEFAULT 60,
  auto_retry_enabled BOOLEAN DEFAULT true,
  max_retry_attempts INTEGER DEFAULT 3,
  bounce_handling_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Security configurations
CREATE TABLE public.security_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_blacklist TEXT[] DEFAULT ARRAY[]::TEXT[],
  ip_whitelist TEXT[] DEFAULT ARRAY[]::TEXT[],
  rate_limit_login INTEGER DEFAULT 5,
  rate_limit_api INTEGER DEFAULT 100,
  rate_limit_window_minutes INTEGER DEFAULT 15,
  password_min_length INTEGER DEFAULT 8,
  password_require_uppercase BOOLEAN DEFAULT true,
  password_require_lowercase BOOLEAN DEFAULT true,
  password_require_numbers BOOLEAN DEFAULT true,
  password_require_symbols BOOLEAN DEFAULT false,
  session_timeout_minutes INTEGER DEFAULT 1440, -- 24 hours
  max_concurrent_sessions INTEGER DEFAULT 3,
  two_factor_required BOOLEAN DEFAULT false,
  suspicious_activity_threshold INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notification configurations
CREATE TABLE public.notification_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  push_notifications_enabled BOOLEAN DEFAULT true,
  email_notifications_enabled BOOLEAN DEFAULT true,
  sms_notifications_enabled BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  weekend_notifications BOOLEAN DEFAULT true,
  max_notifications_per_day INTEGER DEFAULT 50,
  fcm_server_key TEXT,
  apns_certificate TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Webhook configurations
CREATE TABLE public.webhook_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  events TEXT[] NOT NULL, -- Array of event names
  is_active BOOLEAN DEFAULT true,
  secret_key TEXT,
  retry_attempts INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  headers JSONB DEFAULT '{}',
  created_by UUID,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Service monitoring table
CREATE TABLE public.service_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down')),
  response_time_ms INTEGER,
  error_message TEXT,
  last_check TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uptime_percentage NUMERIC(5,2) DEFAULT 100.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_status ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "admins_can_access_system_configurations" ON public.system_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_message_templates" ON public.message_templates
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_sms_configurations" ON public.sms_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_email_configurations" ON public.email_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_security_configurations" ON public.security_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_notification_configurations" ON public.notification_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_webhook_configurations" ON public.webhook_configurations
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_access_service_status" ON public.service_status
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- Create indexes for performance
CREATE INDEX idx_system_configurations_key ON public.system_configurations(config_key);
CREATE INDEX idx_message_templates_type_category ON public.message_templates(type, category);
CREATE INDEX idx_service_status_service_name ON public.service_status(service_name);
CREATE INDEX idx_webhook_configurations_events ON public.webhook_configurations USING gin(events);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_configurations_updated_at
  BEFORE UPDATE ON public.system_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
  BEFORE UPDATE ON public.message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sms_configurations_updated_at
  BEFORE UPDATE ON public.sms_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_configurations_updated_at
  BEFORE UPDATE ON public.email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_configurations_updated_at
  BEFORE UPDATE ON public.security_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_configurations_updated_at
  BEFORE UPDATE ON public.notification_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_webhook_configurations_updated_at
  BEFORE UPDATE ON public.webhook_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configurations
INSERT INTO public.system_configurations (config_key, config_value, config_type, description) VALUES
('maintenance_mode', '{"enabled": false, "message": "Sistema em manutenção. Voltamos em breve."}', 'system', 'Modo de manutenção do sistema'),
('user_registration_enabled', '{"enabled": true}', 'system', 'Permitir registro de novos usuários'),
('max_groups_per_user', '{"free": 2, "vip": 50}', 'limits', 'Máximo de grupos por usuário'),
('max_users_per_group', '{"limit": 50}', 'limits', 'Máximo de usuários por grupo'),
('kyc_required', '{"enabled": false}', 'compliance', 'KYC obrigatório para novos usuários'),
('data_retention_days', '{"audit_logs": 365, "notifications": 90, "otp_codes": 1}', 'compliance', 'Política de retenção de dados');

INSERT INTO public.sms_configurations (sender_id, rate_limit_per_number, allowed_countries) VALUES
('KIXIKILA', 5, ARRAY['244']);

INSERT INTO public.email_configurations (rate_limit_per_email) VALUES (10);

INSERT INTO public.security_configurations (
  rate_limit_login, 
  rate_limit_api, 
  password_min_length,
  password_require_uppercase,
  password_require_lowercase,
  password_require_numbers
) VALUES (5, 100, 8, true, true, true);

INSERT INTO public.notification_configurations (
  push_notifications_enabled,
  email_notifications_enabled,
  sms_notifications_enabled
) VALUES (true, true, true);

-- Insert default templates
INSERT INTO public.message_templates (name, type, category, subject, content, variables) VALUES
('OTP Email', 'email', 'otp', 'Código de Verificação - KIXIKILA', 
 '<h2>Código de Verificação</h2><p>Seu código é: <strong>{{otp_code}}</strong></p><p>Válido por 10 minutos.</p>',
 '["otp_code", "user_name", "expires_at"]'),
('OTP SMS', 'sms', 'otp', NULL,
 'KIXIKILA: Seu código de verificação é {{otp_code}}. Válido por 10 minutos. Não compartilhe.',
 '["otp_code", "user_name"]'),
('Welcome Email', 'email', 'welcome', 'Bem-vindo ao KIXIKILA!',
 '<h2>Bem-vindo, {{user_name}}!</h2><p>Obrigado por se juntar ao KIXIKILA. Sua jornada de poupança colaborativa começa agora!</p>',
 '["user_name", "registration_date"]'),
('Security Alert', 'email', 'security', 'Alerta de Segurança - KIXIKILA',
 '<h2>Alerta de Segurança</h2><p>Detectamos uma atividade suspeita em sua conta: {{activity_description}}</p>',
 '["user_name", "activity_description", "ip_address", "timestamp"]');