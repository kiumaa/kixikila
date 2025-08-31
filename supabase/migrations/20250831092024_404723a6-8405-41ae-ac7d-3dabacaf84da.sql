-- Fix RLS Policy Conflicts and Security Issues
-- Phase 1: Remove conflicting policies and add secure functions

-- Create secure helper functions first
CREATE OR REPLACE FUNCTION public.get_user_role(target_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = target_user_id LIMIT 1);
END;
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(group_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = is_group_member.group_id 
    AND gm.user_id = is_group_member.user_id 
    AND gm.status = 'active'
  );
END;
$$;

-- Drop conflicting policies on users table
DROP POLICY IF EXISTS "deny_all_unauthenticated_access" ON public.users;
DROP POLICY IF EXISTS "deny_unauthenticated_access_users" ON public.users;

-- Create secure user policies
CREATE POLICY "authenticated_users_secure_access" ON public.users
FOR ALL USING (
  auth.uid() IS NOT NULL AND (
    id = auth.uid() OR 
    public.get_user_role(auth.uid()) = 'admin'
  )
);

-- Fix group_members RLS to avoid recursion
DROP POLICY IF EXISTS "group_admins_can_add_members" ON public.group_members;

CREATE POLICY "secure_group_member_insert" ON public.group_members
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR 
    public.get_user_role(auth.uid()) = 'admin'
  )
);

-- Secure transaction access - users can only see their own transactions
DROP POLICY IF EXISTS "users_can_view_group_transactions_secure" ON public.transactions;

CREATE POLICY "users_own_transactions_only" ON public.transactions
FOR SELECT USING (
  user_id = auth.uid() OR 
  public.get_user_role(auth.uid()) = 'admin'
);

-- Enhance system configurations security
CREATE POLICY "super_admin_only_sensitive_config" ON public.system_configurations
FOR ALL USING (
  public.is_super_admin() AND 
  (NOT is_sensitive OR public.get_user_role(auth.uid()) = 'admin')
);

-- Add data masking function for financial data
CREATE OR REPLACE FUNCTION public.mask_sensitive_amount(
  amount numeric, 
  owner_id uuid, 
  requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF requesting_user_id = owner_id OR public.get_user_role(requesting_user_id) = 'admin' THEN
    RETURN amount::text;
  END IF;
  RETURN '***.**';
END;
$$;

-- Add audit logging for sensitive access
CREATE OR REPLACE FUNCTION public.log_sensitive_access(
  entity_type text,
  entity_id text,
  access_type text DEFAULT 'read'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, entity_type, entity_id, action, metadata, ip_address
  ) VALUES (
    auth.uid(),
    entity_type,
    entity_id,
    'sensitive_access_' || access_type,
    jsonb_build_object(
      'access_timestamp', NOW(),
      'security_level', 'high'
    ),
    inet_client_addr()
  );
END;
$$;