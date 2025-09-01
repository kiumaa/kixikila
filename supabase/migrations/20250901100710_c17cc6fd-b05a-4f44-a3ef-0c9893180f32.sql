-- Fix RLS policies to prevent infinite recursion by creating security definer functions
-- and simplifying complex policy conditions

-- Create security definer functions to avoid recursion in RLS policies
CREATE OR REPLACE FUNCTION public.check_group_admin_access(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = target_group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role IN ('creator', 'admin') 
    AND gm.status = 'active'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_group_membership(target_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = target_group_id 
    AND gm.user_id = auth.uid() 
    AND gm.status IN ('active', 'pending')
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "group_admins_can_remove_members" ON public.group_members;
DROP POLICY IF EXISTS "users_and_admins_can_update_memberships" ON public.group_members;
DROP POLICY IF EXISTS "users_can_view_group_members" ON public.group_members;
DROP POLICY IF EXISTS "creators_and_admins_can_update_groups" ON public.groups;
DROP POLICY IF EXISTS "users_can_view_accessible_groups" ON public.groups;

-- Create simplified, non-recursive policies for group_members
CREATE POLICY "group_members_delete_policy" ON public.group_members
FOR DELETE USING (
  user_id = auth.uid() OR public.check_group_admin_access(group_id)
);

CREATE POLICY "group_members_update_policy" ON public.group_members  
FOR UPDATE USING (
  user_id = auth.uid() OR public.check_group_admin_access(group_id)
);

CREATE POLICY "group_members_select_policy" ON public.group_members
FOR SELECT USING (
  user_id = auth.uid() OR public.check_group_membership(group_id)
);

-- Recreate groups policies using security definer functions
CREATE POLICY "groups_update_policy" ON public.groups
FOR UPDATE USING (
  creator_id = auth.uid() OR public.check_group_admin_access(id)
);

CREATE POLICY "groups_select_policy" ON public.groups
FOR SELECT USING (
  NOT is_private 
  OR creator_id = auth.uid() 
  OR public.is_current_user_admin()
  OR public.check_group_membership(id)
);

-- Add validation trigger for group creation
CREATE OR REPLACE FUNCTION public.validate_group_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure creator_id matches authenticated user
  IF NEW.creator_id != auth.uid() THEN
    RAISE EXCEPTION 'Creator ID must match authenticated user';
  END IF;
  
  -- Validate required fields
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Group name is required';
  END IF;
  
  IF NEW.contribution_amount <= 0 THEN
    RAISE EXCEPTION 'Contribution amount must be positive';
  END IF;
  
  IF NEW.max_members < 2 OR NEW.max_members > 50 THEN
    RAISE EXCEPTION 'Max members must be between 2 and 50';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for group validation
DROP TRIGGER IF EXISTS validate_group_creation_trigger ON public.groups;
CREATE TRIGGER validate_group_creation_trigger
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_group_creation();