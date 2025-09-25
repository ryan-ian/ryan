-- Temporary RLS disable for debugging
-- Run this to test if the issue is purely RLS-related

-- 1. Temporarily disable RLS on meeting_invitations
ALTER TABLE public.meeting_invitations DISABLE ROW LEVEL SECURITY;

-- Test your invitation flow now
-- If it works, the issue is definitely RLS policies

-- 2. After testing, re-enable RLS
-- ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- 3. If disabling RLS fixes it, we need to create more permissive policies
-- Here's a very permissive policy for testing:

/*
-- Drop all existing policies
DROP POLICY IF EXISTS "Users can create invitations for their own confirmed bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can delete invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Facility managers can view invitations for their facilities" ON public.meeting_invitations;

-- Create a very permissive policy for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON public.meeting_invitations
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
*/
