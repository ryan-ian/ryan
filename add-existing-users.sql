-- This script will add existing auth users to the public.users table
-- Run this if you have users in auth.users but not in public.users

INSERT INTO public.users (id, email, name, role, department, position, date_created, last_login)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User ' || au.id::text),
  'user',
  COALESCE(au.raw_user_meta_data->>'department', 'Unassigned'),
  COALESCE(au.raw_user_meta_data->>'position', 'Unassigned'),
  now(),
  now()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- To make a specific user an admin, run:
-- UPDATE public.users SET role = 'admin' WHERE email = 'admin@example.com'; 