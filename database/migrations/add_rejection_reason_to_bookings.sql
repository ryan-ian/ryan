-- Add rejection_reason column to bookings table
-- This migration adds support for facility managers to provide rejection reasons when declining booking requests

-- 1. Add the rejection_reason column to the bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- 2. Add a comment to document the column purpose
COMMENT ON COLUMN public.bookings.rejection_reason IS 'Reason provided by facility manager when rejecting a booking request';

-- 3. Add RLS policies to ensure rejection_reason can be updated by facility managers
-- First, drop the policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Facility managers can update rejection reasons" ON public.bookings;

-- Create a policy that allows facility managers to update rejection_reason for bookings in their facilities
CREATE POLICY "Facility managers can update rejection reasons"
  ON public.bookings FOR UPDATE
  USING (
    -- Allow facility managers to update bookings for rooms in their facilities
    -- (using the facilities.manager_id field from your schema)
    EXISTS (
      SELECT 1
      FROM public.facilities f
      JOIN public.rooms r ON f.id = r.facility_id
      WHERE r.id = bookings.room_id
      AND f.manager_id = auth.uid()
    )
    OR
    -- Also allow users with facility_manager role to update any booking
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'facility_manager'
    )
    OR
    -- Also allow admins to update any booking
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 4. Create a function to safely update booking status with rejection reason
CREATE OR REPLACE FUNCTION public.update_booking_with_rejection(
  booking_id_param UUID,
  new_status TEXT,
  rejection_reason_param TEXT DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  booking_data JSON,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  booking_record RECORD;
  facility_manager_check BOOLEAN := FALSE;
  is_admin BOOLEAN := FALSE;
  is_facility_manager_role BOOLEAN := FALSE;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;

  -- Check if the current user has facility_manager role
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'facility_manager'
  ) INTO is_facility_manager_role;

  -- Check if the current user is a facility manager for this booking's room
  -- (using the facilities.manager_id field from your schema)
  SELECT EXISTS(
    SELECT 1
    FROM public.facilities f
    JOIN public.rooms r ON f.id = r.facility_id
    JOIN public.bookings b ON b.room_id = r.id
    WHERE b.id = booking_id_param
    AND f.manager_id = auth.uid()
  ) INTO facility_manager_check;

  -- Verify authorization
  IF NOT (is_admin OR facility_manager_check OR is_facility_manager_role) THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Unauthorized: Only facility managers and admins can update booking status'::TEXT;
    RETURN;
  END IF;

  -- Validate status
  IF new_status NOT IN ('pending', 'confirmed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Invalid status: must be pending, confirmed, or cancelled'::TEXT;
    RETURN;
  END IF;

  -- Update the booking
  UPDATE public.bookings
  SET
    status = new_status,
    rejection_reason = CASE
      WHEN new_status = 'cancelled' THEN rejection_reason_param
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = booking_id_param
  RETURNING * INTO booking_record;

  -- Check if booking was found and updated
  IF booking_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Booking not found'::TEXT;
    RETURN;
  END IF;

  -- Return success with booking data
  RETURN QUERY SELECT TRUE, row_to_json(booking_record), NULL::TEXT;

EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, SQLERRM::TEXT;
END;
$$;

-- 5. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.update_booking_with_rejection(UUID, TEXT, TEXT) TO authenticated;

-- 6. Add an index on rejection_reason for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_rejection_reason
ON public.bookings(rejection_reason)
WHERE rejection_reason IS NOT NULL;

-- 7. Verification and logging
DO $$
BEGIN
  RAISE NOTICE 'Rejection reason migration completed successfully';
  RAISE NOTICE 'Added rejection_reason column to bookings table';
  RAISE NOTICE 'Created update_booking_with_rejection function';
  RAISE NOTICE 'Added appropriate RLS policies';
END $$;
