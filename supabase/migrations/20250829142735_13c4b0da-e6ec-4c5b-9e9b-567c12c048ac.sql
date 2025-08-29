-- Fix security warnings by setting proper search paths for functions

-- Update generate_invite_token function
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
BEGIN
  RETURN 'invite_' || encode(gen_random_bytes(16), 'hex');
END;
$$;

-- Update accept_group_invitation function
CREATE OR REPLACE FUNCTION public.accept_group_invitation(invitation_token TEXT)
RETURNS VOID 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  invitation_record public.group_invitations%ROWTYPE;
  user_email TEXT;
BEGIN
  -- Get current user email
  SELECT email INTO user_email FROM public.users WHERE id = auth.uid();
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get invitation record
  SELECT * INTO invitation_record 
  FROM public.group_invitations 
  WHERE invite_token = invitation_token 
  AND status = 'pending' 
  AND expires_at > NOW()
  AND email = user_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invitation';
  END IF;
  
  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_id = invitation_record.group_id 
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'User is already a member of this group';
  END IF;
  
  -- Check if group has space
  IF (
    SELECT current_members FROM public.groups 
    WHERE id = invitation_record.group_id
  ) >= (
    SELECT max_members FROM public.groups 
    WHERE id = invitation_record.group_id
  ) THEN
    RAISE EXCEPTION 'Group is full';
  END IF;
  
  -- Add user to group
  INSERT INTO public.group_members (
    group_id, user_id, role, status, invited_by
  ) VALUES (
    invitation_record.group_id,
    auth.uid(),
    invitation_record.role,
    'active',
    invitation_record.invited_by
  );
  
  -- Update invitation status
  UPDATE public.group_invitations 
  SET status = 'accepted', accepted_at = NOW()
  WHERE invite_token = invitation_token;
  
  -- Update group member count
  UPDATE public.groups 
  SET current_members = current_members + 1
  WHERE id = invitation_record.group_id;
  
  -- Create notification for group admin
  INSERT INTO public.notifications (
    user_id, type, title, message, metadata
  ) VALUES (
    invitation_record.invited_by,
    'member_joined',
    'Novo membro no grupo',
    (SELECT full_name FROM public.users WHERE id = auth.uid()) || 
    ' aceitou o convite e juntou-se ao grupo ' || 
    (SELECT name FROM public.groups WHERE id = invitation_record.group_id),
    jsonb_build_object(
      'group_id', invitation_record.group_id,
      'new_member_id', auth.uid()
    )
  );
END;
$$;