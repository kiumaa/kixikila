-- Create PIN system for secure authentication
-- This table stores encrypted PINs for users

-- Create auth_pin table if it doesn't exist (check first)
DO $$
BEGIN
    -- Check if auth_pin table exists
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'auth_pin') THEN
        CREATE TABLE public.auth_pin (
            user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            pin_hash TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.auth_pin ENABLE ROW LEVEL SECURITY;

        -- Create RLS policies
        CREATE POLICY "Users can manage their own PIN" ON public.auth_pin
        FOR ALL USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());

        -- Create trigger for updated_at
        CREATE OR REPLACE FUNCTION update_auth_pin_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER auth_pin_updated_at
        BEFORE UPDATE ON public.auth_pin
        FOR EACH ROW
        EXECUTE FUNCTION update_auth_pin_updated_at();

        RAISE NOTICE 'auth_pin table created successfully';
    ELSE
        RAISE NOTICE 'auth_pin table already exists';
    END IF;
END
$$;