-- Fix the status mismatch in meeting_invitations RLS policy
-- The policy is checking for 'approved' but bookings use 'confirmed' status

-- 1. Drop the problematic policy
DROP POLICY "Users can create invitations for their own approved bookings" ON public.meeting_invitations;

-- 2. Create the corrected policy with 'confirmed' status
CREATE POLICY "Users can create invitations for their own confirmed bookings"
ON public.meeting_invitations
FOR INSERT
WITH CHECK (
  (organizer_id = auth.uid()) 
  AND 
  (booking_id IN (
    SELECT bookings.id
    FROM bookings
    WHERE (bookings.user_id = auth.uid()) 
    AND (bookings.status = 'confirmed')  -- Changed from 'approved' to 'confirmed'
  ))
);
