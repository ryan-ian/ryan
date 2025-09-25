-- Final RLS fix for meeting_invitations
-- This will create working policies that allow proper invitation creation

-- 1. Ensure RLS is enabled
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can create invitations for their own confirmed bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can create invitations for their own approved bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can view invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can update invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can delete invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Admins can manage all invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Admins can view all invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Facility managers can view invitations for their facilities" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.meeting_invitations;

-- 3. Create simplified, working policies

-- Policy 1: Allow viewing invitations
CREATE POLICY "View meeting invitations"
ON public.meeting_invitations
FOR SELECT
USING (
  -- User is the organizer
  organizer_id = auth.uid()
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'facility_manager')
  )
);

-- Policy 2: Allow creating invitations (simplified)
CREATE POLICY "Create meeting invitations"
ON public.meeting_invitations
FOR INSERT
WITH CHECK (
  -- User must be authenticated
  auth.uid() IS NOT NULL
  AND
  -- User must be the organizer
  organizer_id = auth.uid()
);

-- Policy 3: Allow updating invitations
CREATE POLICY "Update meeting invitations"
ON public.meeting_invitations
FOR UPDATE
USING (
  -- User is the organizer
  organizer_id = auth.uid()
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'facility_manager')
  )
);

-- Policy 4: Allow deleting invitations
CREATE POLICY "Delete meeting invitations"
ON public.meeting_invitations
FOR DELETE
USING (
  -- User is the organizer
  organizer_id = auth.uid()
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'facility_manager')
  )
);

-- 4. Grant necessary table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meeting_invitations TO authenticated;
GRANT ALL ON public.meeting_invitations TO service_role;

-- 5. Test query to verify the user can create invitations
-- (Run this to see if your user meets the basic requirements)
SELECT 
  auth.uid() as current_user_id,
  auth.uid() IS NOT NULL as is_authenticated,
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid()
  ) as user_exists_in_users_table;
