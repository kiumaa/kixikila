-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.validate_rls_security()
RETURNS TABLE(
    table_name text,
    policy_count bigint,
    has_select boolean,
    has_insert boolean,
    has_update boolean,
    has_delete boolean
) 
LANGUAGE sql 
SECURITY DEFINER 
SET search_path = public
AS $$
    SELECT 
        t.table_name::text,
        COUNT(p.policyname) as policy_count,
        bool_or(p.cmd = 'r') as has_select,
        bool_or(p.cmd = 'a') as has_insert,
        bool_or(p.cmd = 'w') as has_update,
        bool_or(p.cmd = 'd') as has_delete
    FROM information_schema.tables t
    LEFT JOIN pg_policies p ON p.tablename = t.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_name IN ('audit_logs', 'notifications', 'otp_codes', 'users')
    GROUP BY t.table_name
    ORDER BY t.table_name;
$$;