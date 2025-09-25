-- =====================================================================
-- ATTENDANCE SYSTEM UPDATE - REMOVE RSVP REQUIREMENTS
-- =====================================================================
-- This update removes RSVP status checking from the attendance system
-- so that all invitees can mark attendance regardless of RSVP response
-- =====================================================================

-- Update the verify_attendance_code function to remove RSVP status check
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
  
  -- REMOVED: RSVP status check
  -- No longer checking if invitation_record.status = 'accepted'
  
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

-- Update the occupancy function to return total_invited instead of total_accepted
CREATE OR REPLACE FUNCTION get_meeting_occupancy(booking_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  present_count INTEGER;
  total_invited INTEGER;
  room_capacity INTEGER;
BEGIN
  -- Get present count
  SELECT COUNT(*)
  INTO present_count
  FROM public.meeting_invitations
  WHERE booking_id = booking_id_param 
    AND attendance_status = 'present';
  
  -- Get total invited count (all invitations, regardless of RSVP status)
  SELECT COUNT(*)
  INTO total_invited
  FROM public.meeting_invitations
  WHERE booking_id = booking_id_param;
  
  -- Get room capacity
  SELECT r.capacity
  INTO room_capacity
  FROM public.bookings b
  JOIN public.rooms r ON b.room_id = r.id
  WHERE b.id = booking_id_param;
  
  RETURN jsonb_build_object(
    'present', COALESCE(present_count, 0),
    'invited', COALESCE(total_invited, 0),
    'capacity', COALESCE(room_capacity, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION verify_attendance_code(UUID, TEXT) IS 'Verifies attendance code and marks attendance if valid (no RSVP requirement)';
COMMENT ON FUNCTION get_meeting_occupancy(UUID) IS 'Returns current occupancy statistics for a meeting (present/invited/capacity)';

COMMIT;



