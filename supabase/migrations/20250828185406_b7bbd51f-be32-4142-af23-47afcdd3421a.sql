-- Comprehensive Security Definer Investigation and Fix
-- Let's identify what exactly is triggering the linter warning

-- 1. Check all database objects that might have SECURITY DEFINER
SELECT 
  'FUNCTION' as object_type,
  n.nspname as schema_name,
  p.proname as object_name,
  p.prosecdef as is_security_definer,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.prosecdef = true
  AND p.proname ILIKE '%view%'

UNION ALL

-- Check for any views that might be flagged
SELECT 
  'VIEW' as object_type,
  schemaname as schema_name,
  viewname as object_name,
  CASE WHEN definition ILIKE '%security%definer%' THEN true ELSE false END as is_security_definer,
  definition
FROM pg_views 
WHERE schemaname = 'public'
  AND (definition ILIKE '%security%definer%' OR viewname ILIKE '%view%')

UNION ALL

-- Check for any materialized views  
SELECT 
  'MATERIALIZED VIEW' as object_type,
  schemaname as schema_name,
  matviewname as object_name,
  CASE WHEN definition ILIKE '%security%definer%' THEN true ELSE false END as is_security_definer,
  definition
FROM pg_matviews
WHERE schemaname = 'public'
  AND definition ILIKE '%security%definer%';

-- Remove any potentially problematic objects and recreate them safely
-- This is a comprehensive fix approach

-- Let's check if there are any views in the private schema
SELECT 
  schemaname, 
  viewname,
  definition
FROM pg_views 
WHERE definition ILIKE '%security%definer%'
  OR schemaname = 'private';

-- Create a completely secure replacement system
-- Instead of relying on potentially problematic views, we'll use pure functions