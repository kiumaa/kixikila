-- Create message_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.message_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('sms', 'email', 'push')),
    category TEXT NOT NULL, -- 'verification', 'login', 'welcome', etc.
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    variables TEXT[], -- Array of available variables like ['brandName', 'code', 'minutes']
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint for type + category
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_templates_type_category 
ON public.message_templates(type, category) WHERE is_active = true;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON public.message_templates(type);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON public.message_templates(is_active);

-- Enable RLS
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for message templates
DROP POLICY IF EXISTS "Admin users can manage message templates" ON public.message_templates;
CREATE POLICY "Admin users can manage message templates" 
ON public.message_templates 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_message_templates_updated_at ON public.message_templates;
CREATE TRIGGER update_message_templates_updated_at
    BEFORE UPDATE ON public.message_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default SMS templates if they don't exist
INSERT INTO public.message_templates (type, category, name, content, variables, is_active)
VALUES 
    ('sms', 'verification', 'SMS Phone Verification', '{{brandName}}: O seu código de verificação é: {{code}}. Válido por {{minutes}} minutos.', ARRAY['brandName', 'code', 'minutes'], true),
    ('sms', 'login', 'SMS Login Code', '{{brandName}}: Código de login: {{code}}. Se não foi você, ignore esta mensagem.', ARRAY['brandName', 'code'], true)
ON CONFLICT (type, category) DO NOTHING;