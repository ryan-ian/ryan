-- Migration: Update bookings table with payment fields
-- This adds payment-related fields to the existing bookings table

-- First, update the status constraint to include new payment statuses
ALTER TABLE public.bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status = ANY (ARRAY[
    'pending'::text, 
    'approved'::text, 
    'payment_pending'::text, 
    'paid'::text, 
    'confirmed'::text, 
    'cancelled'::text, 
    'completed'::text
]));

-- Add payment-related fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'not_required' 
    CHECK (payment_status = ANY (ARRAY[
        'not_required'::text, 
        'pending'::text, 
        'processing'::text, 
        'paid'::text, 
        'failed'::text, 
        'refunded'::text
    ])),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paystack_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_reference ON public.bookings(payment_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_paystack_reference ON public.bookings(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON public.bookings(payment_id);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_expires_at ON public.bookings(payment_expires_at);

-- Update existing bookings to have appropriate payment status
-- Existing confirmed bookings should be marked as 'not_required' for payment
UPDATE public.bookings 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL AND status = 'confirmed';

-- Existing pending bookings should be marked as 'not_required' for payment (backward compatibility)
UPDATE public.bookings 
SET payment_status = 'not_required' 
WHERE payment_status IS NULL AND status = 'pending';

COMMENT ON COLUMN public.bookings.payment_id IS 'Reference to payment transaction record';
COMMENT ON COLUMN public.bookings.total_cost IS 'Total amount to be paid for this booking in GHS';
COMMENT ON COLUMN public.bookings.payment_status IS 'Payment status independent of booking status';
COMMENT ON COLUMN public.bookings.payment_reference IS 'Our internal payment reference';
COMMENT ON COLUMN public.bookings.paystack_reference IS 'Paystack transaction reference';
COMMENT ON COLUMN public.bookings.payment_expires_at IS 'When payment link expires (15 minutes default)';

