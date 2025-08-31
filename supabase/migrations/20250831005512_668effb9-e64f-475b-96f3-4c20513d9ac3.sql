-- Tornar o campo email nullable e adicionar constraint única no telefone
ALTER TABLE public.users 
ALTER COLUMN email DROP NOT NULL;

-- Adicionar constraint única no telefone (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_phone_unique'
    ) THEN
        ALTER TABLE public.users 
        ADD CONSTRAINT users_phone_unique UNIQUE (phone);
    END IF;
END $$;

-- Criar índice no telefone para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_phone_lookup ON public.users(phone) WHERE phone IS NOT NULL;