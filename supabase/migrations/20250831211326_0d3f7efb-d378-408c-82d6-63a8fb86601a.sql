-- Create PIN system for secure authentication
-- This table stores encrypted PINs for users

CREATE TABLE IF NOT EXISTS public.auth_pin (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    pin_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.auth_pin ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can manage their own PIN" ON public.auth_pin;
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

DROP TRIGGER IF EXISTS auth_pin_updated_at ON public.auth_pin;
CREATE TRIGGER auth_pin_updated_at
BEFORE UPDATE ON public.auth_pin
FOR EACH ROW
EXECUTE FUNCTION update_auth_pin_updated_at();