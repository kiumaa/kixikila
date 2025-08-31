-- Add first_login flag to users table for onboarding flow
ALTER TABLE public.users 
ADD COLUMN first_login boolean DEFAULT true;

-- Update existing users to have first_login = false since they already exist
UPDATE public.users 
SET first_login = false;

-- Create index for better performance on first_login queries
CREATE INDEX idx_users_first_login ON public.users(first_login) WHERE first_login = true;