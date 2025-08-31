-- Add proper RLS policies for system_configurations table
-- This ensures only authenticated admins can access system configuration data

-- Drop existing conflicting policies if they exist
DROP POLICY IF EXISTS "super_admin_only_system_configurations" ON public.system_configurations;
DROP POLICY IF EXISTS "admins_can_access_system_configurations" ON public.system_configurations;

-- Create comprehensive admin-only policies for system_configurations
CREATE POLICY "admins_can_select_system_configurations"
ON public.system_configurations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_insert_system_configurations"
ON public.system_configurations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_update_system_configurations"
ON public.system_configurations
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

CREATE POLICY "admins_can_delete_system_configurations"
ON public.system_configurations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Also ensure webhook_configurations has proper policies
DROP POLICY IF EXISTS "super_admin_only_webhook_configurations" ON public.webhook_configurations;

CREATE POLICY "admins_can_access_webhook_configurations"
ON public.webhook_configurations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Create index for better performance on admin role checks
CREATE INDEX IF NOT EXISTS idx_users_role_admin ON public.users(role) WHERE role = 'admin';