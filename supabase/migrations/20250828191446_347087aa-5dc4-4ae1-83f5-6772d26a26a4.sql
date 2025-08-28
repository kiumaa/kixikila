-- FINAL SECURITY DEFINER VIEW CLEANUP
-- Find and remove any remaining security definer views or functions

-- Check for any views with SECURITY DEFINER
DO $$
DECLARE
    view_rec RECORD;
    func_rec RECORD;
BEGIN
    -- First, check for any remaining views with security definer
    FOR view_rec IN
        SELECT n.nspname as schema_name, c.relname as view_name
        FROM pg_class c
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE c.relkind = 'v'
        AND n.nspname IN ('public', 'private')
        AND EXISTS (
            SELECT 1 FROM pg_rewrite r
            WHERE r.ev_class = c.oid
            AND r.ev_action::text ILIKE '%security definer%'
        )
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schema_name, view_rec.view_name);
        RAISE NOTICE 'Dropped remaining security definer view: %.%', view_rec.schema_name, view_rec.view_name;
    END LOOP;
    
    -- Also check for any views created by problematic functions
    FOR view_rec IN
        SELECT schemaname, viewname
        FROM pg_views
        WHERE schemaname IN ('public', 'private')
        AND (
            viewname ILIKE '%safe%' OR
            viewname ILIKE '%secure%' OR
            definition ILIKE '%definer%'
        )
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_rec.schemaname, view_rec.viewname);
        RAISE NOTICE 'Dropped potentially problematic view: %.%', view_rec.schemaname, view_rec.viewname;
    END LOOP;
    
    -- Final check for any problematic user-related functions that might create views
    FOR func_rec IN
        SELECT n.nspname as schema_name, p.proname as function_name
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'private')
        AND p.prosecdef = true
        AND (
            p.proname ILIKE '%users_safe%' OR
            p.proname ILIKE '%get_all_users%' OR
            p.proname ILIKE '%user_list%'
        )
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I CASCADE', func_rec.schema_name, func_rec.function_name);
        RAISE NOTICE 'Dropped problematic security definer function: %.%', func_rec.schema_name, func_rec.function_name;
    END LOOP;
END $$;

-- Ensure private schema is completely removed if it exists
DROP SCHEMA IF EXISTS private CASCADE;

-- Final security validation log
INSERT INTO public.audit_logs (
    user_id,
    entity_type,
    entity_id,
    action,
    metadata
) VALUES (
    NULL,
    'security_system',
    'final_security_cleanup',
    'security_definer_views_removed',
    jsonb_build_object(
        'action', 'removed_all_remaining_security_definer_objects',
        'timestamp', NOW(),
        'version', '2.3'
    )
);