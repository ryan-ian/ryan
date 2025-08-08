-- Create facility_availability table and RLS policies

CREATE TABLE IF NOT EXISTS public.facility_availability (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  facility_id uuid NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  operating_hours jsonb NOT NULL DEFAULT '{
    "monday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "tuesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "wednesday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "thursday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "friday": {"enabled": true, "start": "08:00", "end": "18:00"},
    "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
    "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
  }'::jsonb,
  min_booking_duration integer NOT NULL DEFAULT 30,
  max_booking_duration integer NOT NULL DEFAULT 480,
  buffer_time integer NOT NULL DEFAULT 15,
  advance_booking_days integer NOT NULL DEFAULT 30,
  same_day_booking_enabled boolean NOT NULL DEFAULT true,
  max_bookings_per_user_per_day integer NOT NULL DEFAULT 1,
  max_bookings_per_user_per_week integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT facility_availability_facility_unique UNIQUE (facility_id),
  CONSTRAINT facility_availability_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT facility_availability_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_facility_availability_updated_at ON public.facility_availability;
CREATE TRIGGER trig_facility_availability_updated_at
BEFORE UPDATE ON public.facility_availability
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Enable RLS
ALTER TABLE public.facility_availability ENABLE ROW LEVEL SECURITY;

-- Policies: Facility managers can manage their facility; admins can manage all
DROP POLICY IF EXISTS "Facility managers can view facility availability" ON public.facility_availability;
CREATE POLICY "Facility managers can view facility availability"
  ON public.facility_availability FOR SELECT
  USING (
    facility_id IN (
      SELECT f.id FROM public.facilities f
      WHERE f.manager_id = auth.uid()
    ) OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Facility managers can update facility availability" ON public.facility_availability;
CREATE POLICY "Facility managers can update facility availability"
  ON public.facility_availability FOR UPDATE
  USING (
    facility_id IN (
      SELECT f.id FROM public.facilities f
      WHERE f.manager_id = auth.uid()
    ) OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

DROP POLICY IF EXISTS "Facility managers can insert facility availability" ON public.facility_availability;
CREATE POLICY "Facility managers can insert facility availability"
  ON public.facility_availability FOR INSERT
  WITH CHECK (
    facility_id IN (
      SELECT f.id FROM public.facilities f
      WHERE f.manager_id = auth.uid()
    ) OR auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facility_availability TO authenticated;

