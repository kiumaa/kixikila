-- Criar usuário admin no sistema
-- Inserir na tabela users o usuário admin
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  is_active,
  email_verified,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@kixikila.pro',
  'Administrador Kixikila',
  'admin',
  true,
  true,
  now(),
  now()
) ON CONFLICT (email) DO NOTHING;

-- Criar função para verificar se um usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.users 
    WHERE id = user_id 
    AND role = 'admin' 
    AND is_active = true
  );
$$;

-- Criar política RLS para admins poderem ver todos os usuários
CREATE POLICY "admins_can_view_all_users" 
ON public.users 
FOR SELECT 
TO authenticated
USING (
  auth.uid() = id OR 
  public.is_admin(auth.uid())
);