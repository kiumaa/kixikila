-- First, fix the category constraint to include marketing
ALTER TABLE public.message_templates 
DROP CONSTRAINT IF EXISTS message_templates_category_check;

ALTER TABLE public.message_templates 
ADD CONSTRAINT message_templates_category_check 
CHECK (category IN ('otp', 'welcome', 'notification', 'security', 'transaction', 'reminder', 'marketing'));

-- Add unique constraint on name column for ON CONFLICT to work
ALTER TABLE public.message_templates 
ADD CONSTRAINT message_templates_name_unique UNIQUE (name);

-- Now insert the default message templates
INSERT INTO public.message_templates (name, type, category, subject, content, language, is_default, is_active, variables, version) VALUES
('OTP SMS', 'sms', 'otp', NULL, 'O seu código de verificação KIXIKILA é: {otp_code}. Válido por 10 minutos. Não partilhe este código.', 'pt', true, true, '["otp_code"]', 1),
('Boas-vindas Email', 'email', 'welcome', 'Bem-vindo ao KIXIKILA!', 'Olá {user.name}!

Bem-vindo à plataforma KIXIKILA! Estamos felizes por ter juntado à nossa comunidade de poupança colaborativa.

Com o KIXIKILA pode:
- Criar grupos de poupança
- Participar em sorteios
- Alcançar os seus objetivos financeiros

Comece já a poupar!

Equipa KIXIKILA', 'pt', true, true, '["user.name"]', 1),
('Lembrete Pagamento SMS', 'sms', 'reminder', NULL, 'Olá {user.name}! Lembrete: o seu pagamento para o grupo "{group.name}" vence amanhã. Valor: {amount}. Pague através da app KIXIKILA.', 'pt', true, true, '["user.name", "group.name", "amount"]', 1),
('Notificação Prémio Email', 'email', 'notification', 'Parabéns! Foi contemplado no sorteio', 'Parabéns {user.name}!

Tem excelentes notícias! Foi o contemplado no sorteio do grupo "{group.name}".

Valor a receber: {amount}
Data do sorteio: {date}

O valor será creditado na sua carteira KIXIKILA nos próximos minutos.

Continue a poupar connosco!

Equipa KIXIKILA', 'pt', true, true, '["user.name", "group.name", "amount", "date"]', 1),
('Promoção Marketing Email', 'email', 'marketing', 'Oferta Especial KIXIKILA - {offer.title}', 'Olá {user.name}!

Temos uma oferta especial para si!

🎉 {offer.title}
{offer.description}

Esta oferta é válida até {offer.expires_date}.

Não perca esta oportunidade!

Equipa KIXIKILA', 'pt', false, true, '["user.name", "offer.title", "offer.description", "offer.expires_date"]', 1)
ON CONFLICT (name) DO NOTHING;