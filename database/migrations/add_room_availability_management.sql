-- Room Availability Management System Database Schema
-- This migration adds comprehensive availability management for rooms

-- 1. Create room_availability table for operating hours and booking rules
CREATE TABLE IF NOT EXISTS room_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Operating Hours (JSON format for flexibility)
  operating_hours JSONB DEFAULT '{
    "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
  }'::jsonb,
  
  -- Booking Slot Configuration
  min_booking_duration INTEGER DEFAULT 30, -- minutes
  max_booking_duration INTEGER DEFAULT 480, -- minutes (8 hours)
  buffer_time INTEGER DEFAULT 15, -- minutes between bookings
  
  -- Advanced Scheduling Rules
  advance_booking_days INTEGER DEFAULT 30, -- how far in advance users can book
  same_day_booking_enabled BOOLEAN DEFAULT true,
  max_bookings_per_user_per_day INTEGER DEFAULT 1,
  max_bookings_per_user_per_week INTEGER DEFAULT 5,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Ensure one availability record per room
  CONSTRAINT unique_room_availability UNIQUE (room_id)
);

-- 2. Create room_blackouts table for blackout periods
CREATE TABLE IF NOT EXISTS room_blackouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  
  -- Blackout Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Time Period
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Recurrence (for recurring blackouts)
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB, -- {"type": "weekly", "days": ["monday", "friday"], "end_date": "2024-12-31"}
  
  -- Blackout Type
  blackout_type VARCHAR(50) DEFAULT 'maintenance' CHECK (
    blackout_type IN ('maintenance', 'cleaning', 'event', 'holiday', 'repair', 'other')
  ),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_availability_room_id ON room_availability(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_room_id ON room_blackouts(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_time_range ON room_blackouts(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_active ON room_blackouts(is_active);

-- 4. Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_room_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_room_availability_updated_at
    BEFORE UPDATE ON room_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_room_availability_updated_at();

CREATE TRIGGER update_room_blackouts_updated_at
    BEFORE UPDATE ON room_blackouts
    FOR EACH ROW
    EXECUTE FUNCTION update_room_availability_updated_at();

-- 5. Create default availability settings for existing rooms
INSERT INTO room_availability (room_id, created_by)
SELECT id, (SELECT id FROM auth.users WHERE role = 'admin' LIMIT 1)
FROM rooms 
WHERE id NOT IN (SELECT room_id FROM room_availability);

-- 6. Add RLS policies for room_availability
ALTER TABLE room_availability ENABLE ROW LEVEL SECURITY;

-- Facility managers can view availability for their rooms
CREATE POLICY "Facility managers can view room availability" 
  ON room_availability FOR SELECT 
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Facility managers can update availability for their rooms
CREATE POLICY "Facility managers can update room availability" 
  ON room_availability FOR UPDATE 
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all room availability" 
  ON room_availability FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 7. Add RLS policies for room_blackouts
ALTER TABLE room_blackouts ENABLE ROW LEVEL SECURITY;

-- Facility managers can manage blackouts for their rooms
CREATE POLICY "Facility managers can manage room blackouts" 
  ON room_blackouts FOR ALL 
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Admins can manage all blackouts
CREATE POLICY "Admins can manage all room blackouts" 
  ON room_blackouts FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Users can view blackouts (to see when rooms are unavailable)
CREATE POLICY "Users can view room blackouts" 
  ON room_blackouts FOR SELECT 
  USING (is_active = true);

-- 8. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON room_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON room_blackouts TO authenticated;
