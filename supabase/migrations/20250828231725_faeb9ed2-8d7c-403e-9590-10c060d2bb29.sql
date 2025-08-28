-- Phase 1: Complete Business Schema for KIXIKILA (Updated)
-- Only creating missing components, avoiding conflicts with existing schema

-- 1. Create missing ENUMs (check if they don't exist first)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_role') THEN
        CREATE TYPE public.member_role AS ENUM ('creator', 'admin', 'member', 'pending');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'member_status') THEN
        CREATE TYPE public.member_status AS ENUM ('active', 'pending', 'suspended', 'left');
    END IF;
END $$;

-- 2. Create GROUPS table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    group_type public.group_type NOT NULL DEFAULT 'savings',
    status public.group_status NOT NULL DEFAULT 'draft',
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Financial settings
    contribution_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    contribution_frequency TEXT NOT NULL DEFAULT 'monthly',
    max_members INTEGER NOT NULL DEFAULT 10,
    current_members INTEGER NOT NULL DEFAULT 1,
    total_pool DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Group settings
    is_private BOOLEAN NOT NULL DEFAULT true,
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    auto_withdraw BOOLEAN NOT NULL DEFAULT false,
    
    -- Dates
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    next_payout_date TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    rules JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Create GROUP_MEMBERS table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Role and status
    role public.member_role NOT NULL DEFAULT 'member',
    status public.member_status NOT NULL DEFAULT 'pending',
    
    -- Financial tracking
    total_contributed DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_withdrawn DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    
    -- Position in payout order (for rotation systems)
    payout_position INTEGER,
    last_payout_date TIMESTAMP WITH TIME ZONE,
    
    -- Dates
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    
    -- Invitation tracking
    invited_by UUID REFERENCES public.users(id),
    invitation_token TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Constraints
    UNIQUE(group_id, user_id)
);

-- 4. Enable RLS on all tables (only if tables exist)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'groups' AND table_schema = 'public') THEN
        ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'group_members' AND table_schema = 'public') THEN
        ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Create RLS Policies for GROUPS (drop if exists to avoid conflicts)
DROP POLICY IF EXISTS "users_can_view_accessible_groups" ON public.groups;
CREATE POLICY "users_can_view_accessible_groups" ON public.groups
    FOR SELECT USING (
        NOT is_private OR 
        creator_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = groups.id 
            AND user_id = auth.uid() 
            AND status IN ('active', 'pending')
        )
    );

DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON public.groups;
CREATE POLICY "authenticated_users_can_create_groups" ON public.groups
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND 
        creator_id = auth.uid()
    );

DROP POLICY IF EXISTS "creators_and_admins_can_update_groups" ON public.groups;
CREATE POLICY "creators_and_admins_can_update_groups" ON public.groups
    FOR UPDATE USING (
        creator_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = groups.id 
            AND user_id = auth.uid() 
            AND role IN ('creator', 'admin')
            AND status = 'active'
        )
    );

DROP POLICY IF EXISTS "creators_can_delete_groups" ON public.groups;
CREATE POLICY "creators_can_delete_groups" ON public.groups
    FOR DELETE USING (creator_id = auth.uid());

DROP POLICY IF EXISTS "admins_can_view_all_groups" ON public.groups;
CREATE POLICY "admins_can_view_all_groups" ON public.groups
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
    );

-- 6. Create RLS Policies for GROUP_MEMBERS
DROP POLICY IF EXISTS "users_can_view_group_members" ON public.group_members;
CREATE POLICY "users_can_view_group_members" ON public.group_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid() 
            AND gm.status = 'active'
        )
    );

DROP POLICY IF EXISTS "group_admins_can_add_members" ON public.group_members;
CREATE POLICY "group_admins_can_add_members" ON public.group_members
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members 
            WHERE group_id = group_members.group_id 
            AND user_id = auth.uid() 
            AND role IN ('creator', 'admin')
            AND status = 'active'
        ) OR
        -- Allow self-joining for invitations
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "users_and_admins_can_update_memberships" ON public.group_members;
CREATE POLICY "users_and_admins_can_update_memberships" ON public.group_members
    FOR UPDATE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid() 
            AND gm.role IN ('creator', 'admin')
            AND gm.status = 'active'
        )
    );

DROP POLICY IF EXISTS "group_admins_can_remove_members" ON public.group_members;
CREATE POLICY "group_admins_can_remove_members" ON public.group_members
    FOR DELETE USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm 
            WHERE gm.group_id = group_members.group_id 
            AND gm.user_id = auth.uid() 
            AND gm.role IN ('creator', 'admin')
            AND gm.status = 'active'
        )
    );

-- 7. Create indexes for performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON public.groups(creator_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_type ON public.groups(group_type);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON public.groups(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_status ON public.group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON public.group_members(role);
CREATE INDEX IF NOT EXISTS idx_group_members_group_user ON public.group_members(group_id, user_id);

-- 8. Create triggers for updated_at (only if they don't exist)
DROP TRIGGER IF EXISTS update_groups_updated_at ON public.groups;
CREATE TRIGGER update_groups_updated_at
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_group_members_updated_at ON public.group_members;
CREATE TRIGGER update_group_members_updated_at
    BEFORE UPDATE ON public.group_members
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create business logic functions
CREATE OR REPLACE FUNCTION public.get_user_groups(target_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
    group_id UUID,
    group_name TEXT,
    group_type public.group_type,
    group_status public.group_status,
    member_role public.member_role,
    member_status public.member_status,
    total_contributed DECIMAL,
    current_balance DECIMAL,
    next_payout_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT 
        g.id,
        g.name,
        g.group_type,
        g.status,
        gm.role,
        gm.status,
        gm.total_contributed,
        gm.current_balance,
        g.next_payout_date
    FROM public.groups g
    JOIN public.group_members gm ON g.id = gm.group_id
    WHERE gm.user_id = target_user_id
    AND gm.status IN ('active', 'pending')
    ORDER BY g.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_group_statistics(target_group_id UUID)
RETURNS TABLE(
    total_members INTEGER,
    active_members INTEGER,
    total_contributed DECIMAL,
    total_withdrawn DECIMAL,
    current_pool DECIMAL,
    avg_contribution DECIMAL
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT 
        COUNT(*)::INTEGER as total_members,
        COUNT(CASE WHEN status = 'active' THEN 1 END)::INTEGER as active_members,
        COALESCE(SUM(total_contributed), 0) as total_contributed,
        COALESCE(SUM(total_withdrawn), 0) as total_withdrawn,
        COALESCE(SUM(current_balance), 0) as current_pool,
        COALESCE(AVG(total_contributed), 0) as avg_contribution
    FROM public.group_members
    WHERE group_id = target_group_id;
$$;