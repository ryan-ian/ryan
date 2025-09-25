-- Migration: Create refunds table for refund tracking
-- This table tracks all refund requests and their status

CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  paystack_refund_id VARCHAR(255), -- Paystack's refund transaction ID
  status VARCHAR(50) NOT NULL CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'processing'::text, 
    'completed'::text, 
    'failed'::text
  ])),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  initiated_by UUID REFERENCES public.users(id), -- Who initiated the refund
  
  CONSTRAINT refunds_pkey PRIMARY KEY (id),
  CONSTRAINT refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE,
  CONSTRAINT refunds_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE,
  CONSTRAINT refunds_initiated_by_fkey FOREIGN KEY (initiated_by) REFERENCES public.users(id)
);

-- Add indexes for performance
CREATE INDEX idx_refunds_payment_id ON public.refunds(payment_id);
CREATE INDEX idx_refunds_booking_id ON public.refunds(booking_id);
CREATE INDEX idx_refunds_status ON public.refunds(status);
CREATE INDEX idx_refunds_created_at ON public.refunds(created_at);
CREATE INDEX idx_refunds_paystack_refund_id ON public.refunds(paystack_refund_id);

-- Add RLS policies
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

-- Users can view their own refund records
CREATE POLICY "Users can view their own refunds" 
  ON public.refunds FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admins can view all refund records
CREATE POLICY "Admins can view all refunds" 
  ON public.refunds FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view refunds for their facilities
CREATE POLICY "Facility managers can view facility refunds" 
  ON public.refunds FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'facility_manager'
    ) AND
    booking_id IN (
      SELECT b.id FROM public.bookings b
      JOIN public.rooms r ON b.room_id = r.id
      JOIN public.facilities f ON r.facility_id = f.id
      WHERE f.manager_id = auth.uid()
    )
  );

-- Only system can insert refund records (via API)
CREATE POLICY "System can insert refunds" 
  ON public.refunds FOR INSERT 
  WITH CHECK (false);

-- Only system can update refund records (via API)
CREATE POLICY "System can update refunds" 
  ON public.refunds FOR UPDATE 
  USING (false);

-- Only system can delete refund records (via API)
CREATE POLICY "System can delete refunds" 
  ON public.refunds FOR DELETE 
  USING (false);

COMMENT ON TABLE public.refunds IS 'Refund transactions for cancelled or rejected bookings';
COMMENT ON COLUMN public.refunds.paystack_refund_id IS 'Paystack refund transaction ID for tracking';
COMMENT ON COLUMN public.refunds.reason IS 'Reason for refund (booking rejection, cancellation, etc.)';
