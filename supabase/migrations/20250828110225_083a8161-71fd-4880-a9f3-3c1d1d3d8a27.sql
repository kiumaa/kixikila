-- Fix RLS Security Vulnerabilities
-- Adding missing INSERT and DELETE policies for all tables

-- =============================================
-- AUDIT_LOGS TABLE POLICIES
-- =============================================

-- Allow service_role to insert audit logs (system logging)
CREATE POLICY "service_role_can_insert_audit_logs" ON public.audit_logs
    FOR INSERT 
    TO service_role
    WITH CHECK (true);

-- Allow admins to delete audit logs (data management)
CREATE POLICY "admins_can_delete_audit_logs" ON public.audit_logs
    FOR DELETE 
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- =============================================
-- NOTIFICATIONS TABLE POLICIES
-- =============================================

-- Allow service_role to insert notifications (system notifications)
CREATE POLICY "service_role_can_insert_notifications" ON public.notifications
    FOR INSERT 
    TO service_role
    WITH CHECK (true);

-- Allow admins to insert notifications (admin notifications)
CREATE POLICY "admins_can_insert_notifications" ON public.notifications
    FOR INSERT 
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- Allow users to delete their own notifications
CREATE POLICY "users_can_delete_own_notifications" ON public.notifications
    FOR DELETE 
    TO authenticated
    USING (user_id = auth.uid());

-- Allow admins to delete any notifications
CREATE POLICY "admins_can_delete_all_notifications" ON public.notifications
    FOR DELETE 
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    ));

-- =============================================
-- OTP_CODES TABLE POLICIES
-- =============================================

-- Allow users to delete their own OTP codes
CREATE POLICY "users_can_delete_own_otp_codes" ON public.otp_codes
    FOR DELETE 
    TO authenticated
    USING (user_id = auth.uid());

-- Allow service_role to delete OTP codes (cleanup operations)
CREATE POLICY "service_role_can_delete_otp_codes" ON public.otp_codes
    FOR DELETE 
    TO service_role
    USING (true);

-- =============================================
-- USERS TABLE POLICIES
-- =============================================

-- Allow admins to delete users (GDPR compliance, account management)
CREATE POLICY "admins_can_delete_users" ON public.users
    FOR DELETE 
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.users AS admin_users
        WHERE admin_users.id = auth.uid() 
        AND admin_users.role = 'admin'
    ));

-- =============================================
-- SECURITY VALIDATION
-- =============================================

-- Create a function to validate RLS policies are working
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