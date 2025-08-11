-- Step-by-step migration to add rejection_reason to bookings table
-- Run each section separately to avoid any syntax issues

-- STEP 1: Add the rejection_reason column
-- Run this first:
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- STEP 2: Add column comment
-- Run this second:
COMMENT ON COLUMN public.bookings.rejection_reason IS 'Reason provided by facility manager when rejecting a booking request';

-- STEP 3: Update the view (Part A - Drop existing view)
-- Run this third:
DROP VIEW IF EXISTS public.active_pending_bookings;

-- STEP 4: Update the view (Part B - Recreate with new column)
-- Run this fourth:
CREATE OR REPLACE VIEW public.active_pending_bookings AS
SELECT 
  b.id,
  b.room_id,
  b.user_id,
  b.title,
  b.description,
  b.start_time,
  b.end_time,
  b.status,
  b.rejection_reason,
  b.created_at,
  b.updated_at,
  r.name as room_name,
  r.location as room_location,
  r.facility_id,
  u.name as user_name,
  u.email as user_email,
  u.department as user_department
FROM public.bookings b
JOIN public.rooms r ON b.room_id = r.id
JOIN public.users u ON b.user_id = u.id
WHERE b.status = 'pending'
AND b.start_time > NOW()
ORDER BY b.start_time ASC;

-- STEP 5: Grant permissions on the view
-- Run this fifth:
GRANT SELECT ON public.active_pending_bookings TO authenticated;

-- STEP 6: Set security invoker for the view
-- Run this sixth:
ALTER VIEW public.active_pending_bookings SET (security_invoker = true);

-- STEP 7: Drop existing policy (if any)
-- Run this seventh:
DROP POLICY IF EXISTS "Facility managers can update rejection reasons" ON public.bookings;

-- STEP 8: Create new RLS policy
-- Run this eighth:
CREATE POLICY "Facility managers can update rejection reasons" 
  ON public.bookings FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 
      FROM public.facility_managers fm
      JOIN public.rooms r ON fm.facility_id = r.facility_id
      WHERE r.id = bookings.room_id 
      AND fm.user_id = auth.uid()
    )
    OR
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- STEP 9: Create the update function
-- Run this ninth:
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
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = 'admin'
  ) INTO is_admin;
  
  SELECT EXISTS(
    SELECT 1 
    FROM public.facility_managers fm
    JOIN public.rooms r ON fm.facility_id = r.facility_id
    JOIN public.bookings b ON b.room_id = r.id
    WHERE b.id = booking_id_param 
    AND fm.user_id = auth.uid()
  ) INTO facility_manager_check;
  
  IF NOT (is_admin OR facility_manager_check) THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Unauthorized: Only facility managers and admins can update booking status'::TEXT;
    RETURN;
  END IF;
  
  IF new_status NOT IN ('pending', 'confirmed', 'cancelled') THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Invalid status: must be pending, confirmed, or cancelled'::TEXT;
    RETURN;
  END IF;
  
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
  
  IF booking_record IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, 'Booking not found'::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT TRUE, row_to_json(booking_record), NULL::TEXT;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT FALSE, NULL::JSON, SQLERRM::TEXT;
END;
$$;

-- STEP 10: Grant function permissions
-- Run this tenth:
GRANT EXECUTE ON FUNCTION public.update_booking_with_rejection(UUID, TEXT, TEXT) TO authenticated;

-- STEP 11: Add performance index
-- Run this eleventh:
CREATE INDEX IF NOT EXISTS idx_bookings_rejection_reason 
ON public.bookings(rejection_reason) 
WHERE rejection_reason IS NOT NULL;
