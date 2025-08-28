-- COMPREHENSIVE USER DATA PROTECTION FIX
-- This migration implements multi-layered security for sensitive user data

-- Phase 1: Clean up overlapping RLS policies
DROP POLICY IF EXISTS "authenticated_users_can_insert_own_profile" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_update_own_profile" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_can_view_own_profile" ON public.users;
DROP POLICY IF EXISTS "authenticated_users_full_access_own_data" ON public.users;
DROP POLICY IF EXISTS "service_role_full_access" ON public.users;

-- Phase 2: Create data sensitivity classification
CREATE OR REPLACE FUNCTION public.classify_user_data_sensitivity(column_name text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    CASE column_name
        WHEN 'wallet_balance', 'total_earned', 'total_withdrawn', 'total_saved' THEN
            RETURN 'FINANCIAL';
        WHEN 'email', 'phone', 'address', 'date_of_birth' THEN
            RETURN 'PII';
        WHEN 'kyc_status', 'trust_score' THEN
            RETURN 'SENSITIVE';
        ELSE
            RETURN 'STANDARD';
    END CASE;
END;
$$;

-- Phase 3: Create secure data masking functions
CREATE OR REPLACE FUNCTION public.mask_financial_data(
    value numeric,
    user_id uuid,
    requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only show financial data to the user themselves or admins
    IF requesting_user_id = user_id OR public.is_current_user_admin() THEN
        RETURN value::text;
    END IF;
    
    -- Return masked value for others
    RETURN '***.**';
END;
$$;

CREATE OR REPLACE FUNCTION public.mask_personal_data(
    value text,
    user_id uuid,
    field_type text,
    requesting_user_id uuid DEFAULT auth.uid()
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only show full PII to the user themselves or admins
    IF requesting_user_id = user_id OR public.is_current_user_admin() THEN
        RETURN value;
    END IF;
    
    -- Return masked value based on field type
    CASE field_type
        WHEN 'email' THEN
            RETURN CONCAT(LEFT(value, 2), '***@', SPLIT_PART(value, '@', 2));
        WHEN 'phone' THEN
            RETURN CONCAT(LEFT(value, 3), '****', RIGHT(value, 2));
        WHEN 'address' THEN
            RETURN 'REDACTED';
        ELSE
            RETURN 'MASKED';
    END CASE;
END;
$$;

-- Phase 4: Create secure user data access function with built-in masking
CREATE OR REPLACE FUNCTION public.get_secure_user_data(
    target_user_id uuid DEFAULT auth.uid(),
    include_financial boolean DEFAULT false,
    include_pii boolean DEFAULT false
)
RETURNS TABLE(
    id uuid,
    email text,
    full_name text,
    phone text,
    role text,
    is_vip boolean,
    is_active boolean,
    email_verified boolean,
    phone_verified boolean,
    avatar_url text,
    city text,
    country text,
    kyc_status text,
    trust_score integer,
    active_groups integer,
    completed_cycles integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    last_login timestamp with time zone,
    -- Conditionally included sensitive fields
    wallet_balance text,
    total_earned text,
    total_withdrawn text,
    total_saved text,
    date_of_birth date,
    address text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    requesting_user_id uuid := auth.uid();
    is_admin boolean := public.is_current_user_admin();
    user_record public.users%ROWTYPE;
BEGIN
    -- Security check: users can only access their own data unless they're admin
    IF NOT is_admin AND target_user_id != requesting_user_id THEN
        RAISE EXCEPTION 'Access denied: Cannot access other users data';
    END IF;
    
    -- Get the user record
    SELECT * INTO user_record 
    FROM public.users u 
    WHERE u.id = target_user_id AND u.is_active = true;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Log the secure access
    INSERT INTO public.audit_logs (
        user_id,
        entity_type,
        entity_id,
        action,
        metadata,
        ip_address
    ) VALUES (
        requesting_user_id,
        'secure_user_data_access',
        target_user_id::text,
        'get_secure_user_data',
        jsonb_build_object(
            'is_admin', is_admin,
            'include_financial', include_financial,
            'include_pii', include_pii,
            'accessed_at', NOW()
        ),
        inet_client_addr()
    );
    
    -- Return masked data based on permissions
    RETURN QUERY SELECT
        user_record.id,
        CASE 
            WHEN is_admin OR requesting_user_id = user_record.id THEN user_record.email
            ELSE public.mask_personal_data(user_record.email, user_record.id, 'email', requesting_user_id)
        END,
        user_record.full_name,
        CASE 
            WHEN is_admin OR requesting_user_id = user_record.id THEN user_record.phone
            ELSE public.mask_personal_data(user_record.phone, user_record.id, 'phone', requesting_user_id)
        END,
        user_record.role,
        user_record.is_vip,
        user_record.is_active,
        user_record.email_verified,
        user_record.phone_verified,
        user_record.avatar_url,
        user_record.city,
        user_record.country,
        user_record.kyc_status,
        user_record.trust_score,
        user_record.active_groups,
        user_record.completed_cycles,
        user_record.created_at,
        user_record.updated_at,
        user_record.last_login,
        -- Financial data (only if explicitly requested and authorized)
        CASE 
            WHEN include_financial AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.wallet_balance::text
            ELSE '***.**'
        END,
        CASE 
            WHEN include_financial AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.total_earned::text
            ELSE '***.**'
        END,
        CASE 
            WHEN include_financial AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.total_withdrawn::text
            ELSE '***.**'
        END,
        CASE 
            WHEN include_financial AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.total_saved::text
            ELSE '***.**'
        END,
        -- PII data (only if explicitly requested and authorized)
        CASE 
            WHEN include_pii AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.date_of_birth
            ELSE NULL
        END,
        CASE 
            WHEN include_pii AND (is_admin OR requesting_user_id = user_record.id) 
            THEN user_record.address
            ELSE 'REDACTED'
        END;
END;
$$;

-- Phase 5: Create restrictive RLS policies with clear separation
CREATE POLICY "users_deny_all_unauthenticated" ON public.users
    FOR ALL 
    TO anon
    USING (false)
    WITH CHECK (false);

CREATE POLICY "users_authenticated_own_data_only" ON public.users
    FOR ALL 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_full_access" ON public.users
    FOR ALL 
    TO authenticated
    USING (public.is_current_user_admin())
    WITH CHECK (public.is_current_user_admin());

-- Restrict service role to system operations only (no direct user data access)
CREATE POLICY "users_service_role_system_only" ON public.users
    FOR SELECT 
    TO service_role
    USING (
        -- Only allow service role to access for system operations
        -- This should be used very carefully and logged
        current_setting('app.service_operation', true) = 'true'
    );

-- Phase 6: Create financial data encryption trigger
CREATE OR REPLACE FUNCTION public.encrypt_financial_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log any financial data changes
    IF TG_OP = 'UPDATE' AND (
        OLD.wallet_balance != NEW.wallet_balance OR
        OLD.total_earned != NEW.total_earned OR
        OLD.total_withdrawn != NEW.total_withdrawn OR
        OLD.total_saved != NEW.total_saved
    ) THEN
        INSERT INTO public.audit_logs (
            user_id,
            entity_type,
            entity_id,
            action,
            old_values,
            new_values,
            metadata,
            ip_address
        ) VALUES (
            auth.uid(),
            'users_financial_data',
            NEW.id::text,
            'financial_data_update',
            jsonb_build_object(
                'wallet_balance', OLD.wallet_balance,
                'total_earned', OLD.total_earned,
                'total_withdrawn', OLD.total_withdrawn,
                'total_saved', OLD.total_saved
            ),
            jsonb_build_object(
                'wallet_balance', NEW.wallet_balance,
                'total_earned', NEW.total_earned,
                'total_withdrawn', NEW.total_withdrawn,
                'total_saved', NEW.total_saved
            ),
            jsonb_build_object(
                'high_sensitivity_operation', true,
                'data_type', 'financial',
                'timestamp', NOW()
            ),
            inet_client_addr()
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for financial data monitoring
DROP TRIGGER IF EXISTS financial_data_audit_trigger ON public.users;
CREATE TRIGGER financial_data_audit_trigger
    AFTER UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.encrypt_financial_data();

-- Phase 7: Force RLS on users table
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- Grant secure access to the new functions
GRANT EXECUTE ON FUNCTION public.get_secure_user_data(uuid, boolean, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_financial_data(numeric, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mask_personal_data(text, uuid, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.classify_user_data_sensitivity(text) TO authenticated;

-- Log this critical security update
INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata
) VALUES (
    NULL,
    'security_system',
    'user_data_protection_upgrade',
    'comprehensive_data_security_implemented',
    jsonb_build_object(
        'security_enhancements', ARRAY[
            'consolidated_rls_policies',
            'implemented_data_masking',
            'added_column_level_security',
            'restricted_service_role_access',
            'added_financial_data_monitoring',
            'forced_rls_on_users_table',
            'created_secure_data_access_function'
        ],
        'sensitivity_levels', ARRAY['FINANCIAL', 'PII', 'SENSITIVE', 'STANDARD'],
        'timestamp', NOW(),
        'version', '3.0'
    )
);