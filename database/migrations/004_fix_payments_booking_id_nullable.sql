-- Migration: Fix payments table to allow NULL booking_id during payment initialization
-- This allows us to create payment records before booking records are created

-- Make booking_id nullable in payments table
DO $$
BEGIN
  -- Check if the column exists and is NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'booking_id' 
    AND is_nullable = 'NO'
  ) THEN
    -- Drop the existing foreign key constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'payments_booking_id_fkey' 
      AND table_name = 'payments'
    ) THEN
      ALTER TABLE public.payments DROP CONSTRAINT payments_booking_id_fkey;
      RAISE NOTICE 'Dropped existing foreign key constraint payments_booking_id_fkey';
    END IF;
    
    -- Make the column nullable
    ALTER TABLE public.payments ALTER COLUMN booking_id DROP NOT NULL;
    RAISE NOTICE 'Made payments.booking_id nullable';
    
    -- Re-add the foreign key constraint (now allowing NULL values)
    ALTER TABLE public.payments 
    ADD CONSTRAINT payments_booking_id_fkey 
    FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
    RAISE NOTICE 'Re-added foreign key constraint with NULL support';
    
  ELSE
    RAISE NOTICE 'payments.booking_id is already nullable or does not exist';
  END IF;
END $$;

-- Add a comment to document the change
COMMENT ON COLUMN public.payments.booking_id IS 'Reference to booking - can be NULL during payment initialization, set after payment verification';

-- Add an index for performance on booking_id (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_payments_booking_id'
  ) THEN
    CREATE INDEX idx_payments_booking_id ON public.payments(booking_id) WHERE booking_id IS NOT NULL;
    RAISE NOTICE 'Created index on payments.booking_id';
  END IF;
END $$;

-- Verify the change
DO $$
DECLARE
  is_nullable_result TEXT;
BEGIN
  SELECT is_nullable INTO is_nullable_result
  FROM information_schema.columns 
  WHERE table_name = 'payments' AND column_name = 'booking_id';
  
  IF is_nullable_result = 'YES' THEN
    RAISE NOTICE '✅ SUCCESS: payments.booking_id is now nullable';
  ELSE
    RAISE NOTICE '❌ ERROR: payments.booking_id is still NOT NULL';
  END IF;
END $$;
