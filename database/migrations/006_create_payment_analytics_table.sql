-- Migration: Create payment analytics table
-- This table stores daily payment analytics for reporting and insights

CREATE TABLE public.payment_analytics (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  facility_id UUID,
  room_id UUID,
  date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  successful_payments INTEGER DEFAULT 0,
  failed_payments INTEGER DEFAULT 0,
  refunded_payments INTEGER DEFAULT 0,
  average_booking_value DECIMAL(10,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'GHS',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT payment_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT payment_analytics_facility_id_fkey 
    FOREIGN KEY (facility_id) REFERENCES public.facilities(id) ON DELETE CASCADE,
  CONSTRAINT payment_analytics_room_id_fkey 
    FOREIGN KEY (room_id) REFERENCES public.rooms(id) ON DELETE CASCADE,
  
  -- Ensure one record per facility/room/date combination
  UNIQUE(facility_id, room_id, date)
);

-- Add indexes for analytics queries
CREATE INDEX idx_payment_analytics_date ON public.payment_analytics(date);
CREATE INDEX idx_payment_analytics_facility_room ON public.payment_analytics(facility_id, room_id);
CREATE INDEX idx_payment_analytics_facility_date ON public.payment_analytics(facility_id, date);
CREATE INDEX idx_payment_analytics_room_date ON public.payment_analytics(room_id, date);
CREATE INDEX idx_payment_analytics_revenue ON public.payment_analytics(total_revenue);

-- Add RLS policies
ALTER TABLE public.payment_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can view all analytics
CREATE POLICY "Admins can view all payment analytics" 
  ON public.payment_analytics FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view analytics for their facilities only
CREATE POLICY "Facility managers can view their analytics" 
  ON public.payment_analytics FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'facility_manager'
    ) AND
    facility_id IN (
      SELECT id FROM public.facilities WHERE manager_id = auth.uid()
    )
  );

-- Only system can insert analytics records (via scheduled jobs/API)
CREATE POLICY "System can insert analytics" 
  ON public.payment_analytics FOR INSERT 
  WITH CHECK (false);

-- Only system can update analytics records (via scheduled jobs/API)
CREATE POLICY "System can update analytics" 
  ON public.payment_analytics FOR UPDATE 
  USING (false);

-- Only system can delete analytics records (via scheduled jobs/API)
CREATE POLICY "System can delete analytics" 
  ON public.payment_analytics FOR DELETE 
  USING (false);

-- Function to update daily analytics
CREATE OR REPLACE FUNCTION public.update_daily_payment_analytics(
  target_date DATE DEFAULT CURRENT_DATE,
  target_facility_id UUID DEFAULT NULL,
  target_room_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  analytics_record RECORD;
BEGIN
  -- Calculate analytics for the specified date/facility/room
  FOR analytics_record IN
    SELECT 
      f.id as facility_id,
      r.id as room_id,
      target_date as date,
      COALESCE(SUM(p.amount), 0) as total_revenue,
      COUNT(b.id) as total_bookings,
      COUNT(CASE WHEN p.status = 'success' THEN 1 END) as successful_payments,
      COUNT(CASE WHEN p.status = 'failed' THEN 1 END) as failed_payments,
      COUNT(CASE WHEN p.status = 'refunded' THEN 1 END) as refunded_payments,
      COALESCE(AVG(p.amount), 0) as average_booking_value
    FROM public.facilities f
    LEFT JOIN public.rooms r ON r.facility_id = f.id
    LEFT JOIN public.bookings b ON b.room_id = r.id 
      AND DATE(b.created_at) = target_date
    LEFT JOIN public.payments p ON p.booking_id = b.id
    WHERE 
      (target_facility_id IS NULL OR f.id = target_facility_id)
      AND (target_room_id IS NULL OR r.id = target_room_id)
    GROUP BY f.id, r.id
  LOOP
    -- Insert or update analytics record
    INSERT INTO public.payment_analytics (
      facility_id,
      room_id,
      date,
      total_revenue,
      total_bookings,
      successful_payments,
      failed_payments,
      refunded_payments,
      average_booking_value,
      currency,
      updated_at
    ) VALUES (
      analytics_record.facility_id,
      analytics_record.room_id,
      analytics_record.date,
      analytics_record.total_revenue,
      analytics_record.total_bookings,
      analytics_record.successful_payments,
      analytics_record.failed_payments,
      analytics_record.refunded_payments,
      analytics_record.average_booking_value,
      'GHS',
      now()
    )
    ON CONFLICT (facility_id, room_id, date)
    DO UPDATE SET
      total_revenue = EXCLUDED.total_revenue,
      total_bookings = EXCLUDED.total_bookings,
      successful_payments = EXCLUDED.successful_payments,
      failed_payments = EXCLUDED.failed_payments,
      refunded_payments = EXCLUDED.refunded_payments,
      average_booking_value = EXCLUDED.average_booking_value,
      updated_at = now();
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.payment_analytics IS 'Daily payment analytics aggregated by facility and room';
COMMENT ON FUNCTION public.update_daily_payment_analytics IS 'Updates daily payment analytics for specified date/facility/room';
