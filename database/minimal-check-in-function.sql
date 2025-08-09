-- Minimal check-in function creation for Conference Hub
-- Execute this in Supabase SQL Editor if the full version fails

-- 1. Add required columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_in_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

-- 2. Create the essential check-in function
CREATE OR REPLACE FUNCTION handle_booking_check_in(
  booking_id_param UUID,
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Get the booking
  SELECT * INTO booking_record FROM bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Check if already checked in
  IF booking_record.checked_in_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already checked in');
  END IF;
  
  -- Check if booking is confirmed
  IF booking_record.status != 'confirmed' THEN
    RETURN json_build_object('success', false, 'error', 'Booking is not confirmed');
  END IF;
  
  -- Check if within check-in window (can check in up to 15 minutes before start time)
  IF NOW() < (booking_record.start_time - INTERVAL '15 minutes') THEN
    RETURN json_build_object('success', false, 'error', 'Check-in not yet available');
  END IF;
  
  -- Check if past auto-release time
  IF booking_record.auto_release_at IS NOT NULL AND NOW() > booking_record.auto_release_at THEN
    RETURN json_build_object('success', false, 'error', 'Booking has been auto-released');
  END IF;
  
  -- Update booking with check-in time
  UPDATE bookings 
  SET 
    checked_in_at = NOW(),
    auto_release_at = NULL,
    updated_at = NOW()
  WHERE id = booking_id_param;
  
  RETURN json_build_object('success', true, 'checked_in_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the auto-release function
CREATE OR REPLACE FUNCTION handle_booking_auto_release(booking_id_param UUID)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Get the booking
  SELECT * INTO booking_record FROM bookings WHERE id = booking_id_param;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Booking not found');
  END IF;
  
  -- Check if already checked in
  IF booking_record.checked_in_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already checked in');
  END IF;
  
  -- Check if past auto-release time
  IF booking_record.auto_release_at IS NULL OR NOW() < booking_record.auto_release_at THEN
    RETURN json_build_object('success', false, 'error', 'Not yet time for auto-release');
  END IF;
  
  -- Cancel the booking
  UPDATE bookings 
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = booking_id_param;
  
  RETURN json_build_object('success', true, 'auto_released_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION handle_booking_auto_release(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_auto_release(UUID) TO anon;

-- 5. Test the function (should return "Booking not found" error, which is expected)
SELECT handle_booking_check_in('00000000-0000-0000-0000-000000000000'::UUID, NULL);
