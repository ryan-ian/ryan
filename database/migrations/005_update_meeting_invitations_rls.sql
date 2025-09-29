-- Migration: Update Row Level Security policies for meeting_invitations table
-- This migration enhances RLS policies to allow facility managers and room-associated users
-- to read invitation data for proper attendance tracking

-- 1. Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view invitations for their own bookings" ON public.meeting_invitations;
DROP POLICY IF EXISTS "Facility managers can view invitations for their facilities" ON public.meeting_invitations;
DROP POLICY IF EXISTS "View meeting invitations" ON public.meeting_invitations;

-- 2. Create enhanced RLS policy for viewing meeting invitations
-- This policy allows:
-- - Organizers to view their own invitations
-- - Facility managers to view invitations for bookings in their facilities
-- - Admins to view all invitations
-- - Users associated with the room where the meeting is taking place
CREATE POLICY "Enhanced view meeting invitations"
ON public.meeting_invitations
FOR SELECT
USING (
  -- User is the organizer of the booking
  organizer_id = auth.uid()
  OR
  -- User is admin
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
  OR
  -- User is a facility manager for the facility where the room is located
  EXISTS (
    SELECT 1 
    FROM public.facilities f
    JOIN public.rooms r ON f.id = r.facility_id
    JOIN public.bookings b ON r.id = b.room_id
    WHERE b.id = booking_id
    AND f.manager_id = auth.uid()
  )
  OR
  -- User has facility_manager role and can access bookings in their managed facilities
  EXISTS (
    SELECT 1 
    FROM public.users u
    JOIN public.facilities f ON u.id = f.manager_id
    JOIN public.rooms r ON f.id = r.facility_id
    JOIN public.bookings b ON r.id = b.room_id
    WHERE u.id = auth.uid()
    AND u.role = 'facility_manager'
    AND b.id = booking_id
  )
  OR
  -- User is associated with the room (for future extensibility)
  EXISTS (
    SELECT 1
    FROM public.bookings b
    JOIN public.rooms r ON b.room_id = r.id
    WHERE b.id = booking_id
    AND (
      -- User is the booking creator
      b.user_id = auth.uid()
      OR
      -- User has access to the facility (for future room-based permissions)
      EXISTS (
        SELECT 1 FROM public.facilities f
        WHERE f.id = r.facility_id
        AND f.manager_id = auth.uid()
      )
    )
  )
);

-- 3. Ensure other policies remain intact for INSERT, UPDATE, DELETE operations
-- Keep existing policies for creating invitations (organizers only)
-- Keep existing policies for updating invitations (organizers and admins)
-- Keep existing policies for deleting invitations (organizers and admins)

-- 4. Add comment explaining the enhanced policy
COMMENT ON POLICY "Enhanced view meeting invitations" ON public.meeting_invitations IS 
'Allows organizers, facility managers, admins, and room-associated users to view meeting invitations for proper attendance tracking and booking management';

-- 5. Ensure RLS is enabled
ALTER TABLE public.meeting_invitations ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions
GRANT SELECT ON public.meeting_invitations TO authenticated;

-- 7. Verify the policy works by testing access patterns
-- (These are comments for manual testing - not executed)
-- Test 1: Organizer should see their invitations
-- Test 2: Facility manager should see invitations for their facilities
-- Test 3: Admin should see all invitations
-- Test 4: Regular users should only see invitations they're involved with
