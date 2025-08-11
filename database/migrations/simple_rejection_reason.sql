-- Simple migration to add rejection_reason column to bookings table
-- This is the minimal version that should work on all PostgreSQL versions

-- Add the rejection_reason column
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.bookings.rejection_reason IS 'Reason provided by facility manager when rejecting a booking request';
