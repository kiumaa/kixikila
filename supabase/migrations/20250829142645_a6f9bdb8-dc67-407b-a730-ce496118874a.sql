-- Create group invitations table
CREATE TABLE IF NOT EXISTS public.group_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  invite_token TEXT NOT NULL UNIQUE,
  role member_role NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT group_invitations_contact_check CHECK (
    (email IS NOT NULL AND phone IS NULL) OR 
    (email IS NULL AND phone IS NOT NULL) OR 
    (email IS NOT NULL AND phone IS NOT NULL)
  )
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON public.group_invitations(invite_token);
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_id ON public.group_invitations(group_id);
CREATE INDEX IF NOT EXISTS idx_group_invitations_status ON public.group_invitations(status);

-- Enable RLS
ALTER TABLE public.group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_invitations
CREATE POLICY "Users can view group invitations" ON public.group_invitations
  FOR SELECT USING (
    -- Group members can view invitations to their groups
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_invitations.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.status = 'active'
    )
    -- Or users can view invitations sent to them
    OR (email = (SELECT email FROM public.users WHERE id = auth.uid()))
  );

CREATE POLICY "Group admins can create invitations" ON public.group_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_invitations.group_id 
      AND gm.user_id = auth.uid() 
      AND gm.role IN ('creator', 'admin')
      AND gm.status = 'active'
    )
    AND invited_by = auth.uid()
  );

CREATE POLICY "Users can update own invitations" ON public.group_invitations
  FOR UPDATE USING (
    -- Users can accept/decline invitations sent to them
    email = (SELECT email FROM public.users WHERE id = auth.uid())
    -- Or group admins can update invitations they sent
    OR (
      invited_by = auth.uid()
      AND EXISTS (
        SELECT 1 FROM public.group_members gm 
        WHERE gm.group_id = group_invitations.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.role IN ('creator', 'admin')
        AND gm.status = 'active'
      )
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_group_invitations_updated_at
  BEFORE UPDATE ON public.group_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate secure invite token
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN 'invite_' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle invitation acceptance
CREATE OR REPLACE FUNCTION public.accept_group_invitation(invitation_token TEXT)
RETURNS VOID AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;