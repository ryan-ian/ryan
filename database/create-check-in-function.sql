-- Create the missing handle_booking_check_in function for Conference Hub
-- Execute this in Supabase SQL Editor to fix the check-in functionality

-- 1. First, ensure the bookings table has the required columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_in_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

-- 2. Create check_in_events table if it doesn't exist (for audit trail)
CREATE TABLE IF NOT EXISTS check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('check_in', 'auto_release', 'manual_release')),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_checked_in_at ON bookings(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_bookings_auto_release_at ON bookings(auto_release_at);
CREATE INDEX IF NOT EXISTS idx_check_in_events_booking_id ON check_in_events(booking_id);

-- 4. Enable RLS on check_in_events table
ALTER TABLE check_in_events ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for check_in_events (drop existing policies first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their check-in events" ON check_in_events;
DROP POLICY IF EXISTS "Admins can view all check-in events" ON check_in_events;
DROP POLICY IF EXISTS "System can insert check-in events" ON check_in_events;

CREATE POLICY "Users can view their check-in events" ON check_in_events
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all check-in events" ON check_in_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
    )
  );

CREATE POLICY "System can insert check-in events" ON check_in_events
  FOR INSERT WITH CHECK (true);

-- 6. Create the main check-in function
CREATE OR REPLACE FUNCTION handle_booking_check_in(
  booking_id_param UUID,
  user_id_param UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
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
  
  -- Create check-in event
  INSERT INTO check_in_events (booking_id, event_type, performed_by_user_id, notes)
  VALUES (booking_id_param, 'check_in', user_id_param, 'User checked in via room display');
  
  RETURN json_build_object('success', true, 'checked_in_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create the auto-release function as well
CREATE OR REPLACE FUNCTION handle_booking_auto_release(booking_id_param UUID)
RETURNS JSON AS $$
DECLARE
  booking_record RECORD;
  result JSON;
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
  
  -- Create auto-release event
  INSERT INTO check_in_events (booking_id, event_type, notes)
  VALUES (booking_id_param, 'auto_release', 'Booking auto-released due to no check-in within grace period');
  
  RETURN json_build_object('success', true, 'auto_released_at', NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Grant execute permissions
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_check_in(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION handle_booking_auto_release(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_booking_auto_release(UUID) TO anon;

-- 9. Create trigger to set auto_release_at when booking is created/updated
CREATE OR REPLACE FUNCTION set_auto_release_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set auto_release_at for confirmed bookings that require check-in
  IF NEW.status = 'confirmed' AND NEW.check_in_required = true THEN
    NEW.auto_release_at = NEW.start_time + INTERVAL '1 minute' * COALESCE(NEW.grace_period_minutes, 15);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger
DROP TRIGGER IF EXISTS set_auto_release_time_trigger ON bookings;
CREATE TRIGGER set_auto_release_time_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_release_time();

-- Test the function (this should return an error about booking not found, which is expected)
SELECT handle_booking_check_in('00000000-0000-0000-0000-000000000000'::UUID, NULL);
