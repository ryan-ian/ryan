-- Migration: Create room pricing history table
-- This table tracks all price changes for rooms to maintain pricing history

CREATE TABLE public.room_pricing_history (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL,
  old_price DECIMAL(10,2),
  new_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  changed_by UUID NOT NULL,
  change_reason TEXT,
  effective_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT room_pricing_history_pkey PRIMARY KEY (id),
  CONSTRAINT room_pricing_history_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  CONSTRAINT room_pricing_history_changed_by_fkey 
    FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_room_pricing_history_room_id ON public.room_pricing_history(room_id);
CREATE INDEX idx_room_pricing_history_changed_by ON public.room_pricing_history(changed_by);
CREATE INDEX idx_room_pricing_history_effective_from ON public.room_pricing_history(effective_from);
CREATE INDEX idx_room_pricing_history_created_at ON public.room_pricing_history(created_at);

-- Add RLS policies
ALTER TABLE public.room_pricing_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all pricing history
CREATE POLICY "Admins can view all pricing history" 
  ON public.room_pricing_history FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view pricing history for their rooms
CREATE POLICY "Facility managers can view room pricing history" 
  ON public.room_pricing_history FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'facility_manager'
    ) AND
    room_id IN (
      SELECT r.id FROM public.rooms r
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Only facility managers and admins can insert pricing history
CREATE POLICY "Facility managers can create pricing history" 
  ON public.room_pricing_history FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role IN ('admin', 'facility_manager')
    ) AND
    (
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin') OR
      room_id IN (
        SELECT r.id FROM public.rooms r
        JOIN public.facilities f ON r.facility_id = f.id
        WHERE f.manager_id = auth.uid()
      )
    )
  );

-- Function to automatically create pricing history when room price changes
CREATE OR REPLACE FUNCTION public.track_room_pricing_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track if hourly_rate actually changed
  IF OLD.hourly_rate IS DISTINCT FROM NEW.hourly_rate THEN
    INSERT INTO public.room_pricing_history (
      room_id,
      old_price,
      new_price,
      currency,
      changed_by,
      change_reason,
      effective_from
    ) VALUES (
      NEW.id,
      OLD.hourly_rate,
      NEW.hourly_rate,
      NEW.currency,
      auth.uid(),
      'Room price updated',
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically track price changes
CREATE TRIGGER room_pricing_history_trigger
  AFTER UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.track_room_pricing_changes();

COMMENT ON TABLE public.room_pricing_history IS 'Historical record of room price changes';
COMMENT ON FUNCTION public.track_room_pricing_changes() IS 'Automatically tracks room price changes in history table';
