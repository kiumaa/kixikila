-- Check if default SMS templates exist, if not insert them
DO $$
BEGIN
    -- Insert verification template if not exists
    IF NOT EXISTS (
        SELECT 1 FROM public.message_templates 
        WHERE type = 'sms' AND category = 'verification' AND is_active = true
    ) THEN
        INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
        VALUES (
            'sms', 
            'verification', 
            'SMS Phone Verification', 
            '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.', 
            '["brandName", "code", "minutes"]'::jsonb, 
            true
        );
    END IF;

    -- Insert login template if not exists
    IF NOT EXISTS (
        SELECT 1 FROM public.message_templates 
        WHERE type = 'sms' AND category = 'login' AND is_active = true
    ) THEN
        INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
        VALUES (
            'sms', 
            'login', 
            'SMS Login Code', 
            '{{brandName}}: Código de login: {{code}}. Se não foi você, ignore esta mensagem.', 
            '["brandName", "code"]'::jsonb, 
            true
        );
    END IF;
END $$;