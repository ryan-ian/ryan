-- Migration: Update bookings table with payment-related fields (SAFE VERSION)
-- Adds payment tracking fields to existing bookings table

-- Add payment fields to bookings table (only if they don't exist)
DO $$
BEGIN
  -- Add payment_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_id UUID;
  END IF;

  -- Add total_cost column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'total_cost'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN total_cost DECIMAL(10,2);
  END IF;

  -- Add payment_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_status VARCHAR(50) DEFAULT 'pending' 
      CHECK (payment_status = ANY (ARRAY[
        'pending'::text,
        'paid'::text,
        'failed'::text,
        'refunded'::text,
        'cancelled'::text
      ]));
  END IF;

  -- Add payment_reference column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_reference'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_reference VARCHAR(255);
  END IF;

  -- Add paystack_reference column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'paystack_reference'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN paystack_reference VARCHAR(255);
  END IF;

  -- Add payment_date column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_date'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add payment_method column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_method VARCHAR(50);
  END IF;

  -- Add payment_expires_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'payment_expires_at'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN payment_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'bookings_payment_id_fkey' 
    AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings 
    ADD CONSTRAINT bookings_payment_id_fkey 
    FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add indexes for performance (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bookings_payment_id'
  ) THEN
    CREATE INDEX idx_bookings_payment_id ON public.bookings(payment_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bookings_payment_status'
  ) THEN
    CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bookings_payment_reference'
  ) THEN
    CREATE INDEX idx_bookings_payment_reference ON public.bookings(payment_reference);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_bookings_paystack_reference'
  ) THEN
    CREATE INDEX idx_bookings_paystack_reference ON public.bookings(paystack_reference);
  END IF;
END $$;

COMMENT ON COLUMN public.bookings.payment_id IS 'Reference to payment transaction';
COMMENT ON COLUMN public.bookings.total_cost IS 'Total cost for the booking in the specified currency';
COMMENT ON COLUMN public.bookings.payment_status IS 'Current payment status of the booking';
COMMENT ON COLUMN public.bookings.payment_reference IS 'Internal payment reference for tracking';
COMMENT ON COLUMN public.bookings.paystack_reference IS 'Paystack transaction reference';
COMMENT ON COLUMN public.bookings.payment_expires_at IS 'When the payment link expires';

