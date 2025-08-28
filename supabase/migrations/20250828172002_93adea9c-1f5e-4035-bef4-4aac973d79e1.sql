-- Check existing categories to understand constraints
SELECT DISTINCT category 
FROM public.message_templates 
WHERE type = 'sms';

-- Insert templates using existing valid categories or common ones
DO $$
BEGIN
    -- Try with 'otp' category first (commonly used for verification)
    IF NOT EXISTS (
        SELECT 1 FROM public.message_templates 
        WHERE type = 'sms' AND category = 'otp' AND is_active = true
    ) THEN
        INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
        VALUES (
            'sms', 
            'otp', 
            'SMS OTP Verification', 
            '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.', 
            '["brandName", "code", "minutes"]'::jsonb, 
            true
        );
    END IF;

    -- Try with 'welcome' category
    IF NOT EXISTS (
        SELECT 1 FROM public.message_templates 
        WHERE type = 'sms' AND category = 'welcome' AND is_active = true
    ) THEN
        INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
        VALUES (
            'sms', 
            'welcome', 
            'SMS Welcome Message', 
            '{{brandName}}: Bem-vindo! A sua conta foi criada com sucesso.', 
            '["brandName"]'::jsonb, 
            true
        );
    END IF;
END $$;