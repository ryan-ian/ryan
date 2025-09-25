-- Debug RLS issue for meeting_invitations
-- Run these queries one by one to understand the problem

-- 1. Check current policies again
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'meeting_invitations'
ORDER BY cmd, policyname;

-- 2. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM information_schema.tables 
WHERE table_name = 'meeting_invitations';

-- 3. Test if the current user can see their own bookings
SELECT 
  id, 
  title, 
  status, 
  user_id,
  auth.uid() as current_user_id,
  (user_id = auth.uid()) as is_owner
FROM bookings 
WHERE user_id = auth.uid() 
AND status = 'confirmed'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check permissions on the table
SELECT 
  grantee, 
  table_name, 
  privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'meeting_invitations';

-- 5. Check if user has the right role
SELECT 
  id,
  email,
  role,
  auth.uid() as current_user_id,
  (id = auth.uid()) as is_current_user
FROM users 
WHERE id = auth.uid();

-- 6. Try a manual insert test (replace with actual values)
-- DO NOT RUN THIS YET - just use it as a template
/*
INSERT INTO meeting_invitations (
  booking_id,
  organizer_id,
  invitee_email,
  invitee_name,
  status
) VALUES (
  'YOUR_BOOKING_ID_HERE',  -- Replace with actual booking ID
  auth.uid(),
  'test@example.com',
  'Test User',
  'pending'
);
*/
