-- Fix Row Level Security policies for meeting_invitations table
-- Run these queries in your Supabase SQL editor

-- 1. First, let's see what policies currently exist
-- (You can run this to check current policies)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'meeting_invitations';

-- 2. Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Users can view meeting invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can create meeting invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Users can update meeting invitations" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Admins can manage meeting invitations" ON public.meeting_invitations;

-- 3. Create new, more permissive policies

-- Allow users to view invitations for their own bookings or invitations sent to them
CREATE POLICY "Users can view meeting invitations"
ON public.meeting_invitations
FOR SELECT
USING (
  -- User is the organizer of the booking
  organizer_id = auth.uid()
  OR
  -- User is the invitee
  invitee_email = (SELECT email FROM public.users WHERE id = auth.uid())
  OR
  -- User is admin/facility manager
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
  )
);

-- Allow users to create invitations for their own confirmed bookings
CREATE POLICY "Users can create meeting invitations"
ON public.meeting_invitations
FOR INSERT
WITH CHECK (
  -- User must be the organizer of the booking
  organizer_id = auth.uid()
  AND
  -- Booking must be confirmed
  EXISTS (
    SELECT 1 FROM public.bookings 
    WHERE id = booking_id 
    AND user_id = auth.uid() 
    AND status = 'confirmed'
  )
);

-- Allow users to update invitations they organized
CREATE POLICY "Users can update meeting invitations"
ON public.meeting_invitations
FOR UPDATE
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

-- Allow invitees to update their own invitation status (for RSVP)
CREATE POLICY "Invitees can update their RSVP status"
ON public.meeting_invitations
FOR UPDATE
USING (
  invitee_email = (SELECT email FROM public.users WHERE id = auth.uid())
)
WITH CHECK (
  invitee_email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- Allow admins/facility managers to manage all invitations
CREATE POLICY "Admins can manage all meeting invitations"
ON public.meeting_invitations
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
  )
);

-- 4. Ensure RLS is enabled
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- 5. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.meeting_invitations TO authenticated;

-- 6. If you have a service role, grant it full access
GRANT ALL ON public.meeting_invitations TO service_role;
