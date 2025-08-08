 -- Check-in Flow Database Migration
-- This script adds the necessary tables and columns for the check-in flow functionality

-- 1. Extend bookings table with check-in related columns
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS check_in_required BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_release_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_minutes INTEGER DEFAULT 15;

-- 2. Create room_issues table for issue reporting
CREATE TABLE IF NOT EXISTS room_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  reported_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,   
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create check_in_events table for audit trail
CREATE TABLE IF NOT EXISTS check_in_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('check_in', 'auto_release', 'manual_release')),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  performed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_checked_in_at ON bookings(checked_in_at);
CREATE INDEX IF NOT EXISTS idx_bookings_auto_release_at ON bookings(auto_release_at);
CREATE INDEX IF NOT EXISTS idx_room_issues_room_id ON room_issues(room_id);
CREATE INDEX IF NOT EXISTS idx_room_issues_status ON room_issues(status);
CREATE INDEX IF NOT EXISTS idx_check_in_events_booking_id ON check_in_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_check_in_events_event_type ON check_in_events(event_type);

-- 5. Add comments for documentation
COMMENT ON COLUMN bookings.checked_in_at IS 'Timestamp when the user checked in for this booking';
COMMENT ON COLUMN bookings.check_in_required IS 'Whether check-in is required for this booking';
COMMENT ON COLUMN bookings.auto_release_at IS 'Timestamp when the booking will be auto-released if not checked in';
COMMENT ON COLUMN bookings.grace_period_minutes IS 'Grace period in minutes before auto-release';

COMMENT ON TABLE room_issues IS 'Issues reported for rooms from the display interface';
COMMENT ON TABLE check_in_events IS 'Audit trail for check-in related events';

-- 6. Enable RLS on new tables
ALTER TABLE room_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_in_events ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for room_issues
-- Users can view issues for rooms they have access to
CREATE POLICY "Users can view room issues" ON room_issues
  FOR SELECT USING (true);

-- Users can report issues for any room
CREATE POLICY "Users can report room issues" ON room_issues
  FOR INSERT WITH CHECK (true);

-- Admins and facility managers can update issues
CREATE POLICY "Admins can manage room issues" ON room_issues
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
    )
  );

-- 8. Create RLS policies for check_in_events
-- Users can view check-in events for their own bookings
CREATE POLICY "Users can view their check-in events" ON check_in_events
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE user_id = auth.uid()
    )
  );

-- Admins can view all check-in events
CREATE POLICY "Admins can view all check-in events" ON check_in_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
    )
  );

-- System can insert check-in events
CREATE POLICY "System can insert check-in events" ON check_in_events
  FOR INSERT WITH CHECK (true);

-- 9. Create function to automatically set auto_release_at when booking is created
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

-- 10. Create trigger to set auto_release_at
DROP TRIGGER IF EXISTS set_auto_release_time_trigger ON bookings;
CREATE TRIGGER set_auto_release_time_trigger
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_auto_release_time();

-- 11. Create function to handle check-in
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

-- 12. Create function to handle auto-release
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
