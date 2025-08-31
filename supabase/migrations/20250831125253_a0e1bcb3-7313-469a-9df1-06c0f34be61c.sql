-- Enable Supabase Phone Authentication
-- Update the handle_new_user trigger to sync auth.users with public.users

-- Update the function to handle sync from auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    full_name, 
    phone, 
    role,
    phone_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Utilizador'),
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    CASE WHEN NEW.phone_confirmed_at IS NOT NULL THEN true ELSE false END,
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists and is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a test admin user in the users table for immediate access
-- This will be synced when we create via Supabase dashboard
INSERT INTO public.users (
  id, 
  email, 
  full_name, 
  phone, 
  role,
  phone_verified,
  is_active,
  kyc_status,
  wallet_balance,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@kixikila.pt',
  'Admin Kixikila',
  '+351912000000',
  'admin',
  true,
  true,
  'approved',
  1000.00,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;