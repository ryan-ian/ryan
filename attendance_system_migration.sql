-- =====================================================================
-- CONFERENCE HUB ATTENDANCE SYSTEM MIGRATION
-- =====================================================================
-- This migration adds QR-based attendance marking functionality to the
-- existing meeting invitations system.
-- =====================================================================

-- Add attendance-related columns to meeting_invitations table
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_code_hash TEXT;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_code_salt TEXT;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_code_expires_at TIMESTAMPTZ;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_code_last_sent_at TIMESTAMPTZ;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_code_send_count INTEGER DEFAULT 0;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'not_present' CHECK (attendance_status IN ('not_present', 'present'));
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS verification_attempts INTEGER DEFAULT 0;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS last_verification_attempt_at TIMESTAMPTZ;
ALTER TABLE public.meeting_invitations ADD COLUMN IF NOT EXISTS check_in_method TEXT CHECK (check_in_method IN ('self_qr', 'manual_admin'));

-- Create meeting_attendance_events table for audit logging
CREATE TABLE IF NOT EXISTS public.meeting_attendance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES public.meeting_invitations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('rsvp_accept', 'rsvp_decline', 'code_sent', 'verify_success', 'verify_failed', 'manual_override')),
  ip_address INET,
  user_agent TEXT,
  additional_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_booking_status ON public.meeting_invitations(booking_id, status);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_booking_attendance ON public.meeting_invitations(booking_id, attendance_status);
CREATE INDEX IF NOT EXISTS idx_meeting_invitations_response_token ON public.meeting_invitations(response_token) WHERE response_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_events_booking ON public.meeting_attendance_events(booking_id, created_at);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_events_invitation ON public.meeting_attendance_events(invitation_id, created_at);

-- Create a function to generate 4-digit attendance codes
CREATE OR REPLACE FUNCTION generate_attendance_code()
RETURNS TEXT AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Create a function to hash attendance codes with salt
CREATE OR REPLACE FUNCTION hash_attendance_code(code TEXT, salt TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(salt || code, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Create a function to generate and store attendance codes
CREATE OR REPLACE FUNCTION generate_and_store_attendance_code(invitation_id UUID, expires_at TIMESTAMPTZ DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
  code TEXT;
  salt TEXT;
  code_hash TEXT;
BEGIN
  -- Generate random 4-digit code and salt
  code := generate_attendance_code();
  salt := encode(gen_random_bytes(16), 'hex');
  code_hash := hash_attendance_code(code, salt);
  
  -- Set default expiry if not provided (meeting end + 15 minutes)
  IF expires_at IS NULL THEN
    SELECT b.end_time + INTERVAL '15 minutes'
    INTO expires_at
    FROM public.meeting_invitations mi
    JOIN public.bookings b ON mi.booking_id = b.id
    WHERE mi.id = invitation_id;
  END IF;
  
  -- Update the invitation with the hashed code
  UPDATE public.meeting_invitations
  SET 
    attendance_code_hash = code_hash,
    attendance_code_salt = salt,
    attendance_code_expires_at = expires_at,
    updated_at = NOW()
  WHERE id = invitation_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to verify attendance codes
CREATE OR REPLACE FUNCTION verify_attendance_code(invitation_id UUID, submitted_code TEXT)
RETURNS JSONB AS $$
DECLARE
  invitation_record RECORD;
  calculated_hash TEXT;
  current_time TIMESTAMPTZ := NOW();
  max_attempts INTEGER := 5;
  cooldown_minutes INTEGER := 15;
BEGIN
  -- Get invitation details
  SELECT 
    mi.*,
    b.start_time,
    b.end_time,
    b.status as booking_status
  INTO invitation_record
  FROM public.meeting_invitations mi
  JOIN public.bookings b ON mi.booking_id = b.id
  WHERE mi.id = invitation_id;
  
  -- Check if invitation exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation not found');
  END IF;
  
  -- Check if user has accepted the invitation
  IF invitation_record.status != 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must accept the meeting invitation first');
  END IF;
  
  -- Check if booking is confirmed
  IF invitation_record.booking_status != 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Meeting booking is not confirmed');
  END IF;
  
  -- Check if within attendance window (meeting start to end + grace)
  IF current_time < invitation_record.start_time THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance marking not yet available');
  END IF;
  
  IF current_time > COALESCE(invitation_record.attendance_code_expires_at, invitation_record.end_time + INTERVAL '15 minutes') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance marking period has expired');
  END IF;
  
  -- Check if already attended
  IF invitation_record.attendance_status = 'present' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance already marked');
  END IF;
  
  -- Check verification attempts and cooldown
  IF invitation_record.verification_attempts >= max_attempts THEN
    IF invitation_record.last_verification_attempt_at > current_time - (cooldown_minutes * INTERVAL '1 minute') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Too many failed attempts. Please try again later');
    ELSE
      -- Reset attempts after cooldown period
      UPDATE public.meeting_invitations
      SET 
        verification_attempts = 0,
        last_verification_attempt_at = current_time
      WHERE id = invitation_id;
    END IF;
  END IF;
  
  -- Verify the code
  calculated_hash := hash_attendance_code(submitted_code, invitation_record.attendance_code_salt);
  
  IF calculated_hash = invitation_record.attendance_code_hash THEN
    -- Success: mark attendance
    UPDATE public.meeting_invitations
    SET 
      attendance_status = 'present',
      attended_at = current_time,
      check_in_method = 'self_qr',
      verification_attempts = 0,
      updated_at = current_time
    WHERE id = invitation_id;
    
    -- Log success event
    INSERT INTO public.meeting_attendance_events (booking_id, invitation_id, event_type)
    VALUES (invitation_record.booking_id, invitation_id, 'verify_success');
    
    RETURN jsonb_build_object('success', true, 'attended_at', current_time);
  ELSE
    -- Failed verification: increment attempts
    UPDATE public.meeting_invitations
    SET 
      verification_attempts = COALESCE(verification_attempts, 0) + 1,
      last_verification_attempt_at = current_time
    WHERE id = invitation_id;
    
    -- Log failed event
    INSERT INTO public.meeting_attendance_events (booking_id, invitation_id, event_type)
    VALUES (invitation_record.booking_id, invitation_id, 'verify_failed');
    
    RETURN jsonb_build_object('success', false, 'error', 'Invalid attendance code');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get meeting occupancy
CREATE OR REPLACE FUNCTION get_meeting_occupancy(booking_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  present_count INTEGER;
  total_accepted INTEGER;
  room_capacity INTEGER;
BEGIN
  -- Get present count
  SELECT COUNT(*)
  INTO present_count
  FROM public.meeting_invitations
  WHERE booking_id = booking_id_param 
    AND attendance_status = 'present';
  
  -- Get total accepted count
  SELECT COUNT(*)
  INTO total_accepted
  FROM public.meeting_invitations
  WHERE booking_id = booking_id_param 
    AND status = 'accepted';
  
  -- Get room capacity
  SELECT r.capacity
  INTO room_capacity
  FROM public.bookings b
  JOIN public.rooms r ON b.room_id = r.id
  WHERE b.id = booking_id_param;
  
  RETURN jsonb_build_object(
    'present', COALESCE(present_count, 0),
    'accepted', COALESCE(total_accepted, 0),
    'capacity', COALESCE(room_capacity, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically generate attendance codes for new invitations
CREATE OR REPLACE FUNCTION auto_generate_attendance_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate for new invitations
  IF TG_OP = 'INSERT' THEN
    PERFORM generate_and_store_attendance_code(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_attendance_code
  AFTER INSERT ON public.meeting_invitations
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_attendance_code();

-- Enable RLS on new table
ALTER TABLE public.meeting_attendance_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for meeting_attendance_events
CREATE POLICY "Users can view their own attendance events" ON public.meeting_attendance_events
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
    OR
    invitation_id IN (
      SELECT id FROM public.meeting_invitations WHERE organizer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all attendance events" ON public.meeting_attendance_events
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

CREATE POLICY "Facility managers can view events for their facilities" ON public.meeting_attendance_events
  FOR SELECT USING (
    booking_id IN (
      SELECT b.id 
      FROM public.bookings b
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Update existing invitations with attendance codes (for existing data)
-- This will be run once during migration
DO $$
DECLARE
  invitation_rec RECORD;
BEGIN
  FOR invitation_rec IN 
    SELECT id FROM public.meeting_invitations 
    WHERE attendance_code_hash IS NULL
  LOOP
    PERFORM generate_and_store_attendance_code(invitation_rec.id);
  END LOOP;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN public.meeting_invitations.attendance_code_hash IS 'SHA256 hash of 4-digit attendance code with salt';
COMMENT ON COLUMN public.meeting_invitations.attendance_code_salt IS 'Random salt for attendance code hashing';
COMMENT ON COLUMN public.meeting_invitations.attendance_code_expires_at IS 'When the attendance code expires (default: meeting end + 15 minutes)';
COMMENT ON COLUMN public.meeting_invitations.attendance_status IS 'Whether attendee is present or not';
COMMENT ON COLUMN public.meeting_invitations.attended_at IS 'Timestamp when attendance was marked';
COMMENT ON COLUMN public.meeting_invitations.check_in_method IS 'How attendance was marked (QR self-service or manual admin)';

COMMENT ON TABLE public.meeting_attendance_events IS 'Audit log for all attendance-related events';
COMMENT ON FUNCTION generate_attendance_code() IS 'Generates a random 4-digit attendance code';
COMMENT ON FUNCTION verify_attendance_code(UUID, TEXT) IS 'Verifies attendance code and marks attendance if valid';
COMMENT ON FUNCTION get_meeting_occupancy(UUID) IS 'Returns current occupancy statistics for a meeting';

-- Commit the migration
COMMIT;

