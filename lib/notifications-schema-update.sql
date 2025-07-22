-- Update the notification type constraint to include new notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS notification_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notification_type_check 
CHECK (type IN ('booking_confirmation', 'booking_rejection', 'booking_reminder', 
                'room_maintenance', 'system_notification', 'booking_request', 'pending_approval'));

-- Update the existing booking notification function to handle admin notifications
CREATE OR REPLACE FUNCTION create_booking_notification() 
RETURNS TRIGGER AS $$
DECLARE
  admin_record RECORD;
  room_name TEXT;
  user_name TEXT;
BEGIN
  -- If a booking status changes to confirmed
  IF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
    -- Create notification for the booking owner
    PERFORM create_notification(
      NEW.user_id,
      'Booking Confirmed',
      'Your booking "' || NEW.title || '" has been confirmed.',
      'booking_confirmation',
      NEW.id
    );
  END IF;
  
  -- If a booking status changes to cancelled (by admin)
  IF (TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status = 'pending') THEN
    -- Create notification for the booking owner
    PERFORM create_notification(
      NEW.user_id,
      'Booking Rejected',
      'Your booking "' || NEW.title || '" has been rejected.',
      'booking_rejection',
      NEW.id
    );
  END IF;
  
  -- If a new booking is created with pending status
  IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
    -- Get room name
    SELECT name INTO room_name FROM rooms WHERE id = NEW.room_id;
    
    -- Get user name
    SELECT name INTO user_name FROM users WHERE id = NEW.user_id;
    
    -- Create notifications for all admins
    FOR admin_record IN 
      SELECT id FROM users WHERE role = 'admin'
    LOOP
      PERFORM create_notification(
        admin_record.id,
        'New Booking Request',
        user_name || ' has requested to book "' || NEW.title || '" in ' || room_name || '.',
        'booking_request',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create new trigger for INSERT operations (only if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_booking_created' 
    AND tgrelid = 'bookings'::regclass
  ) THEN
    CREATE TRIGGER on_booking_created
      AFTER INSERT ON bookings
      FOR EACH ROW
      EXECUTE PROCEDURE create_booking_notification();
  END IF;
END $$;

-- Create function for daily summary of pending bookings for admins
CREATE OR REPLACE FUNCTION create_pending_bookings_summary()
RETURNS VOID AS $$
DECLARE
  admin_record RECORD;
  pending_count INTEGER;
BEGIN
  -- Count pending bookings
  SELECT COUNT(*) INTO pending_count FROM bookings WHERE status = 'pending';
  
  -- If there are pending bookings, notify all admins
  IF pending_count > 0 THEN
    FOR admin_record IN 
      SELECT id FROM users WHERE role = 'admin'
    LOOP
      PERFORM create_notification(
        admin_record.id,
        'Pending Bookings Summary',
        'You have ' || pending_count || ' booking request' || 
        CASE WHEN pending_count = 1 THEN '' ELSE 's' END || 
        ' pending approval.',
        'pending_approval',
        NULL
      );
    END LOOP;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 