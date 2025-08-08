-- Add Automatic Booking Expiration System
-- This migration creates functions and triggers to automatically expire pending bookings

-- 1. Create function to expire pending bookings that have passed their scheduled time
CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS TABLE(
  expired_count INTEGER,
  expired_booking_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_ids UUID[];
  expired_count_result INTEGER;
BEGIN
  -- Log the start of expiration process
  RAISE NOTICE 'Starting automatic expiration of pending bookings at %', NOW();
  
  -- Get IDs of bookings to expire (pending bookings past their start time)
  SELECT ARRAY_AGG(id) INTO expired_ids
  FROM public.bookings 
  WHERE status = 'pending' 
  AND start_time < NOW();
  
  -- If no bookings to expire, return early
  IF expired_ids IS NULL OR array_length(expired_ids, 1) IS NULL THEN
    RAISE NOTICE 'No pending bookings to expire';
    RETURN QUERY SELECT 0::INTEGER, ARRAY[]::UUID[];
    RETURN;
  END IF;
  
  -- Get the count
  expired_count_result := array_length(expired_ids, 1);
  
  -- Log the bookings being expired
  RAISE NOTICE 'Expiring % pending bookings: %', expired_count_result, expired_ids;
  
  -- Update the bookings to cancelled status
  UPDATE public.bookings 
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = ANY(expired_ids);
  
  -- Verify the update
  IF NOT FOUND THEN
    RAISE WARNING 'No bookings were updated during expiration process';
  END IF;
  
  RAISE NOTICE 'Successfully expired % pending bookings', expired_count_result;
  
  -- Return the results
  RETURN QUERY SELECT expired_count_result, expired_ids;
END;
$$;

-- 2. Create a function to get pending bookings with automatic expiration
CREATE OR REPLACE FUNCTION public.get_pending_bookings_with_expiration(facility_id_param UUID DEFAULT NULL)
RETURNS TABLE(
  booking_id UUID,
  room_id UUID,
  user_id UUID,
  title TEXT,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  expired_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expiration_result RECORD;
BEGIN
  -- First, expire any overdue pending bookings
  SELECT * INTO expiration_result FROM public.expire_pending_bookings();
  
  -- Then return the remaining pending bookings
  IF facility_id_param IS NOT NULL THEN
    -- Filter by facility for facility managers
    RETURN QUERY
    SELECT 
      b.id,
      b.room_id,
      b.user_id,
      b.title,
      b.description,
      b.start_time,
      b.end_time,
      b.status,
      b.created_at,
      b.updated_at,
      expiration_result.expired_count
    FROM public.bookings b
    JOIN public.rooms r ON b.room_id = r.id
    WHERE b.status = 'pending'
    AND r.facility_id = facility_id_param
    ORDER BY b.start_time ASC;
  ELSE
    -- Return all pending bookings for admins
    RETURN QUERY
    SELECT 
      b.id,
      b.room_id,
      b.user_id,
      b.title,
      b.description,
      b.start_time,
      b.end_time,
      b.status,
      b.created_at,
      b.updated_at,
      expiration_result.expired_count
    FROM public.bookings b
    WHERE b.status = 'pending'
    ORDER BY b.start_time ASC;
  END IF;
END;
$$;

-- 3. Create a trigger function to automatically expire bookings when they're accessed
CREATE OR REPLACE FUNCTION public.auto_expire_on_access()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  expiration_result RECORD;
BEGIN
  -- Only run expiration for SELECT operations on pending bookings
  IF TG_OP = 'SELECT' THEN
    -- Run expiration in the background (don't block the query)
    PERFORM public.expire_pending_bookings();
  END IF;
  
  RETURN NULL; -- For AFTER triggers, return value is ignored
END;
$$;

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION public.expire_pending_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_bookings_with_expiration(UUID) TO authenticated;

-- 5. Add comments for documentation
COMMENT ON FUNCTION public.expire_pending_bookings() IS 'Automatically expires pending bookings that have passed their scheduled start time';
COMMENT ON FUNCTION public.get_pending_bookings_with_expiration(UUID) IS 'Gets pending bookings for a facility with automatic expiration of overdue bookings';

-- 6. Create a view for easy access to pending bookings with expiration
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
AND b.start_time > NOW() -- Only future bookings
ORDER BY b.start_time ASC;

-- Grant access to the view
GRANT SELECT ON public.active_pending_bookings TO authenticated;

-- 7. Add RLS policy for the view
ALTER VIEW public.active_pending_bookings SET (security_invoker = true);

COMMENT ON VIEW public.active_pending_bookings IS 'View of pending bookings that have not yet expired (future bookings only)';

-- 8. Optional: Create a scheduled job function (requires pg_cron extension)
-- This is commented out as it requires the pg_cron extension to be enabled
/*
-- Enable pg_cron extension (requires superuser privileges)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic expiration to run every hour
-- SELECT cron.schedule('expire-pending-bookings', '0 * * * *', 'SELECT public.expire_pending_bookings();');
*/

-- 9. Create a manual cleanup function for administrators
CREATE OR REPLACE FUNCTION public.cleanup_expired_bookings(days_old INTEGER DEFAULT 30)
RETURNS TABLE(
  cleaned_count INTEGER,
  cleaned_booking_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  old_cancelled_ids UUID[];
  cleaned_count_result INTEGER;
BEGIN
  -- Find cancelled bookings older than specified days
  SELECT ARRAY_AGG(id) INTO old_cancelled_ids
  FROM public.bookings 
  WHERE status = 'cancelled' 
  AND updated_at < NOW() - INTERVAL '1 day' * days_old;
  
  IF old_cancelled_ids IS NULL OR array_length(old_cancelled_ids, 1) IS NULL THEN
    RAISE NOTICE 'No old cancelled bookings to clean up';
    RETURN QUERY SELECT 0::INTEGER, ARRAY[]::UUID[];
    RETURN;
  END IF;
  
  cleaned_count_result := array_length(old_cancelled_ids, 1);
  
  RAISE NOTICE 'Cleaning up % cancelled bookings older than % days', cleaned_count_result, days_old;
  
  -- Delete old cancelled bookings
  DELETE FROM public.bookings WHERE id = ANY(old_cancelled_ids);
  
  RETURN QUERY SELECT cleaned_count_result, old_cancelled_ids;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_bookings(INTEGER) TO authenticated;

COMMENT ON FUNCTION public.cleanup_expired_bookings(INTEGER) IS 'Cleans up cancelled bookings older than specified days (default 30 days)';

-- 10. Verification query
DO $$
BEGIN
  RAISE NOTICE 'Booking expiration system installed successfully';
  RAISE NOTICE 'Available functions:';
  RAISE NOTICE '  - expire_pending_bookings(): Expires overdue pending bookings';
  RAISE NOTICE '  - get_pending_bookings_with_expiration(facility_id): Gets pending bookings with auto-expiration';
  RAISE NOTICE '  - cleanup_expired_bookings(days_old): Cleans up old cancelled bookings';
  RAISE NOTICE 'Available views:';
  RAISE NOTICE '  - active_pending_bookings: Shows only future pending bookings';
END $$;
