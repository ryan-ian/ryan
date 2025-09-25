-- Debug script for OAuth user creation issues
-- Run this to diagnose and fix the current OAuth problem

-- 1. Check current database schema for users table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if there are any existing triggers
SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- 3. Check for any existing functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname LIKE '%handle_new_user%';

-- 4. Check recent auth.users entries (last 10)
SELECT id, email, created_at, raw_user_meta_data, app_metadata, email_confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check recent public.users entries (last 10)
SELECT id, email, name, role, department, position, date_created
FROM public.users 
ORDER BY date_created DESC 
LIMIT 10;

-- 6. Check for orphaned auth users (in auth.users but not in public.users)
SELECT a.id, a.email, a.created_at, a.app_metadata->>'provider' as provider
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE p.id IS NULL
ORDER BY a.created_at DESC;

-- 7. Check current RLS policies on users table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'users';

-- 8. Show database logs (if accessible)
-- Note: This might not work depending on your permissions
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%users%' ORDER BY last_exec_time DESC LIMIT 5;

-- Temporary: Disable RLS to test user creation (ONLY FOR DEBUGGING)
-- IMPORTANT: Re-enable RLS after testing!
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Test user creation manually (uncomment to test)
-- INSERT INTO public.users (id, email, name, role, department, position, date_created, last_login)
-- VALUES ('test-oauth-123', 'test@example.com', 'Test OAuth User', 'user', 'OAuth - Pending', 'OAuth - Pending', NOW(), NOW());
