-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notification_type_check CHECK (
    type IN ('booking_confirmation', 'booking_rejection', 'booking_reminder', 'room_maintenance', 'system_notification')
  )
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the system (service role) can create notifications
CREATE POLICY "Only service role can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE email = 'service@example.com'
  ) OR auth.uid() = user_id);

-- Function to create a notification for a user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title VARCHAR(255),
  p_message TEXT,
  p_type VARCHAR(50),
  p_related_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create booking confirmation notifications
CREATE OR REPLACE FUNCTION create_booking_notification() 
RETURNS TRIGGER AS $$
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for booking notifications
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE PROCEDURE create_booking_notification();

-- Function to create booking reminders
CREATE OR REPLACE FUNCTION create_booking_reminders()
RETURNS VOID AS $$
DECLARE
  booking_record RECORD;
BEGIN
  -- Find bookings that start in the next 15 minutes and haven't had reminders sent
  FOR booking_record IN 
    SELECT b.id, b.user_id, b.title, b.start_time
    FROM bookings b
    WHERE 
      b.start_time BETWEEN NOW() AND NOW() + INTERVAL '15 minutes'
      AND b.status = 'confirmed'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.related_id = b.id 
        AND n.type = 'booking_reminder'
      )
  LOOP
    -- Create reminder notification
    PERFORM create_notification(
      booking_record.user_id,
      'Upcoming Meeting Reminder',
      'Your meeting "' || booking_record.title || '" starts in 15 minutes.',
      'booking_reminder',
      booking_record.id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;