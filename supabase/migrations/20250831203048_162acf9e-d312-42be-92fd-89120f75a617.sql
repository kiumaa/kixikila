-- Create custom types for groups
CREATE TYPE group_type AS ENUM ('savings', 'lottery');
CREATE TYPE group_status AS ENUM ('draft', 'active', 'completed', 'cancelled');
CREATE TYPE member_role AS ENUM ('creator', 'admin', 'member');
CREATE TYPE member_status AS ENUM ('pending', 'active', 'inactive', 'left');

-- Create groups table
CREATE TABLE public.groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL,
    group_type group_type NOT NULL DEFAULT 'savings',
    status group_status NOT NULL DEFAULT 'draft',
    contribution_amount NUMERIC NOT NULL DEFAULT 0.00,
    max_members INTEGER NOT NULL DEFAULT 10,
    current_members INTEGER NOT NULL DEFAULT 1,
    total_pool NUMERIC NOT NULL DEFAULT 0.00,
    is_private BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    contribution_frequency TEXT NOT NULL DEFAULT 'monthly',
    auto_withdraw BOOLEAN NOT NULL DEFAULT false,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    next_payout_date TIMESTAMPTZ,
    current_cycle INTEGER DEFAULT 1,
    last_draw_date TIMESTAMPTZ,
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create group_members table
CREATE TABLE public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role member_role NOT NULL DEFAULT 'member',
    status member_status NOT NULL DEFAULT 'pending',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at TIMESTAMPTZ,
    left_at TIMESTAMPTZ,
    invited_by UUID,
    invitation_token TEXT,
    payout_position INTEGER,
    total_contributed NUMERIC NOT NULL DEFAULT 0.00,
    total_withdrawn NUMERIC NOT NULL DEFAULT 0.00,
    current_balance NUMERIC NOT NULL DEFAULT 0.00,
    last_payout_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- Enable RLS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
CREATE POLICY "users_can_view_accessible_groups" 
ON public.groups 
FOR SELECT 
USING (
    NOT is_private OR 
    creator_id = auth.uid() OR 
    (auth.uid() IS NOT NULL AND get_user_role(auth.uid()) = 'admin') OR
    EXISTS (
        SELECT 1 FROM public.group_members gm 
        WHERE gm.group_id = groups.id 
        AND gm.user_id = auth.uid() 
        AND gm.status IN ('active', 'pending')
    )
);

CREATE POLICY "authenticated_users_can_create_groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND creator_id = auth.uid());

CREATE POLICY "creators_and_admins_can_update_groups" 
ON public.groups 
FOR UPDATE 
USING (
    creator_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.group_members 
        WHERE group_id = groups.id 
        AND user_id = auth.uid() 
        AND role IN ('creator', 'admin') 
        AND status = 'active'
    )
);

CREATE POLICY "creators_can_delete_groups" 
ON public.groups 
FOR DELETE 
USING (creator_id = auth.uid());

CREATE POLICY "admins_can_view_all_groups" 
ON public.groups 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
));

-- RLS Policies for group_members
CREATE POLICY "users_can_view_group_members" 
ON public.group_members 
FOR SELECT 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.group_members gm 
        WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.status = 'active'
    )
);

CREATE POLICY "secure_group_member_insert" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (user_id = auth.uid() OR get_user_role(auth.uid()) = 'admin')
);

CREATE POLICY "users_and_admins_can_update_memberships" 
ON public.group_members 
FOR UPDATE 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.group_members gm 
        WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.role IN ('creator', 'admin') 
        AND gm.status = 'active'
    )
);

CREATE POLICY "group_admins_can_remove_members" 
ON public.group_members 
FOR DELETE 
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.group_members gm 
        WHERE gm.group_id = group_members.group_id 
        AND gm.user_id = auth.uid() 
        AND gm.role IN ('creator', 'admin') 
        AND gm.status = 'active'
    )
);

-- Create indexes for better performance
CREATE INDEX idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX idx_groups_status ON public.groups(status);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_status ON public.group_members(status);