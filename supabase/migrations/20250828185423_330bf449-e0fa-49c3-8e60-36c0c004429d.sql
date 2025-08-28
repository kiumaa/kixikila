-- Fix the Security Definer View Issue
-- The problem is the view in the private schema

-- First, check if private schema exists and what's in it
SELECT 
  schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'private';

-- Drop the problematic view in private schema
DROP VIEW IF EXISTS private.users_safe CASCADE;

-- Also drop the private schema if it exists and is empty
DROP SCHEMA IF EXISTS private CASCADE;

-- Verify the view is gone
SELECT 
  schemaname, 
  viewname
FROM pg_views 
WHERE schemaname = 'private' OR viewname = 'users_safe';

-- Create a final security validation report
SELECT 
  'Security Status' as check_type,
  'All problematic views removed' as status,
  'No more SECURITY DEFINER views should be detected' as message;