-- Simplified Room Availability Management Migration
-- Compatible with existing Conference Hub schema

-- 1. Create room_availability table
CREATE TABLE IF NOT EXISTS public.room_availability (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  
  -- Operating Hours (JSON format for flexibility)
  operating_hours jsonb DEFAULT '{
    "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
  }'::jsonb,
  
  -- Booking Slot Configuration
  min_booking_duration integer DEFAULT 30,
  max_booking_duration integer DEFAULT 480,
  buffer_time integer DEFAULT 15,
  
  -- Advanced Scheduling Rules
  advance_booking_days integer DEFAULT 30,
  same_day_booking_enabled boolean DEFAULT true,
  max_bookings_per_user_per_day integer DEFAULT 1,
  max_bookings_per_user_per_week integer DEFAULT 5,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  
  CONSTRAINT room_availability_pkey PRIMARY KEY (id),
  CONSTRAINT room_availability_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_availability_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT room_availability_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT unique_room_availability UNIQUE (room_id)
);

-- 2. Create room_blackouts table
CREATE TABLE IF NOT EXISTS public.room_blackouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  room_id uuid NOT NULL,
  
  -- Blackout Details
  title character varying(255) NOT NULL,
  description text,
  
  -- Time Period
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  
  -- Recurrence (for recurring blackouts)
  is_recurring boolean DEFAULT false,
  recurrence_pattern jsonb,
  
  -- Blackout Type
  blackout_type character varying(50) DEFAULT 'maintenance',
  
  -- Status
  is_active boolean DEFAULT true,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  
  CONSTRAINT room_blackouts_pkey PRIMARY KEY (id),
  CONSTRAINT room_blackouts_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_blackouts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT room_blackouts_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT room_blackouts_type_check CHECK (blackout_type IN ('maintenance', 'cleaning', 'event', 'holiday', 'repair', 'other'))
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_room_availability_room_id ON public.room_availability(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_room_id ON public.room_blackouts(room_id);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_time_range ON public.room_blackouts(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_room_blackouts_active ON public.room_blackouts(is_active);

-- 4. Create trigger function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_room_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. Create triggers
DROP TRIGGER IF EXISTS update_room_availability_updated_at ON public.room_availability;
CREATE TRIGGER update_room_availability_updated_at
    BEFORE UPDATE ON public.room_availability
    FOR EACH ROW
    EXECUTE FUNCTION public.update_room_availability_updated_at();

DROP TRIGGER IF EXISTS update_room_blackouts_updated_at ON public.room_blackouts;
CREATE TRIGGER update_room_blackouts_updated_at
    BEFORE UPDATE ON public.room_blackouts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_room_availability_updated_at();

-- 6. Enable RLS
ALTER TABLE public.room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_blackouts ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies for room_availability

-- Facility managers can view availability for their rooms
DROP POLICY IF EXISTS "Facility managers can view room availability" ON public.room_availability;
CREATE POLICY "Facility managers can view room availability" 
  ON public.room_availability FOR SELECT 
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Facility managers can update availability for their rooms
DROP POLICY IF EXISTS "Facility managers can update room availability" ON public.room_availability;
CREATE POLICY "Facility managers can update room availability" 
  ON public.room_availability FOR UPDATE 
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Facility managers can insert availability for their rooms
DROP POLICY IF EXISTS "Facility managers can insert room availability" ON public.room_availability;
CREATE POLICY "Facility managers can insert room availability" 
  ON public.room_availability FOR INSERT 
  WITH CHECK (
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can manage all room availability" ON public.room_availability;
CREATE POLICY "Admins can manage all room availability" 
  ON public.room_availability FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- 8. Create RLS policies for room_blackouts

-- Facility managers can manage blackouts for their rooms
DROP POLICY IF EXISTS "Facility managers can manage room blackouts" ON public.room_blackouts;
CREATE POLICY "Facility managers can manage room blackouts" 
  ON public.room_blackouts FOR ALL 
  USING (
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Admins can manage all blackouts
DROP POLICY IF EXISTS "Admins can manage all room blackouts" ON public.room_blackouts;
CREATE POLICY "Admins can manage all room blackouts" 
  ON public.room_blackouts FOR ALL 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Users can view blackouts (to see when rooms are unavailable)
DROP POLICY IF EXISTS "Users can view room blackouts" ON public.room_blackouts;
CREATE POLICY "Users can view room blackouts" 
  ON public.room_blackouts FOR SELECT 
  USING (is_active = true);

-- 9. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_availability TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_blackouts TO authenticated;

-- 10. Create default availability settings for existing rooms
INSERT INTO public.room_availability (room_id, created_by)
SELECT r.id, (SELECT id FROM auth.users LIMIT 1)
FROM public.rooms r 
WHERE r.id NOT IN (SELECT room_id FROM public.room_availability WHERE room_id IS NOT NULL)
ON CONFLICT (room_id) DO NOTHING;

-- Verification query to check if tables were created successfully
SELECT 
  'room_availability' as table_name,
  COUNT(*) as record_count
FROM public.room_availability
UNION ALL
SELECT 
  'room_blackouts' as table_name,
  COUNT(*) as record_count
FROM public.room_blackouts;
