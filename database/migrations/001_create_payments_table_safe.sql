-- Migration: Create payments table for payment transactions (SAFE VERSION)
-- This table tracks all payment transactions made through Paystack

-- Drop table if it exists (for clean migration)
DROP TABLE IF EXISTS public.payments CASCADE;

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL,
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(50) NOT NULL CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'success'::text, 
    'failed'::text, 
    'refunded'::text
  ])),
  payment_method VARCHAR(50), -- mobile_money, card, ussd, bank_transfer
  mobile_network VARCHAR(50), -- mtn, vodafone, airteltigo
  mobile_number VARCHAR(20),
  paystack_response JSONB, -- Store full Paystack response
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX idx_payments_paystack_reference ON public.payments(paystack_reference);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

-- Add RLS policies
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment records
CREATE POLICY "Users can view their own payments" 
  ON public.payments FOR SELECT 
  USING (
    booking_id IN (
      SELECT id FROM public.bookings WHERE user_id = auth.uid()
    )
  );

-- Admins can view all payment records
CREATE POLICY "Admins can view all payments" 
  ON public.payments FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Facility managers can view payments for their facilities
CREATE POLICY "Facility managers can view facility payments" 
  ON public.payments FOR SELECT 
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

-- Only system can insert payment records (via API)
CREATE POLICY "System can insert payments" 
  ON public.payments FOR INSERT 
  WITH CHECK (false);

-- Only system can update payment records (via API)
CREATE POLICY "System can update payments" 
  ON public.payments FOR UPDATE 
  USING (false);

-- Only system can delete payment records (via API)
CREATE POLICY "System can delete payments" 
  ON public.payments FOR DELETE 
  USING (false);

COMMENT ON TABLE public.payments IS 'Payment transactions processed through Paystack';
COMMENT ON COLUMN public.payments.paystack_reference IS 'Unique reference generated for Paystack transaction';
COMMENT ON COLUMN public.payments.paystack_response IS 'Full response from Paystack API for debugging';
COMMENT ON COLUMN public.payments.mobile_network IS 'Mobile money network used (MTN, Vodafone, AirtelTigo)';

