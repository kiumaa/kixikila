-- Fix security issue: Set secure search_path for PIN trigger function
DROP FUNCTION IF EXISTS update_auth_pin_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_auth_pin_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Recreate the trigger with the secure function
DROP TRIGGER IF EXISTS auth_pin_updated_at ON public.auth_pin;
CREATE TRIGGER auth_pin_updated_at
BEFORE UPDATE ON public.auth_pin
FOR EACH ROW
EXECUTE FUNCTION update_auth_pin_updated_at();