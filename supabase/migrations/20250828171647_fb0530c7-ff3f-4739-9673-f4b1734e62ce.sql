-- Insert default SMS templates if they don't exist
INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
VALUES 
    ('sms', 'verification', 'SMS Phone Verification', '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.', '["brandName", "code", "minutes"]'::jsonb, true),
    ('sms', 'login', 'SMS Login Code', '{{brandName}}: Código de login: {{code}}. Se não foi você, ignore esta mensagem.', '["brandName", "code"]'::jsonb, true)
ON CONFLICT (type, category) DO NOTHING;