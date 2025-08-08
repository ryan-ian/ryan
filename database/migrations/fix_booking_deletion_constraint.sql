-- Fix Booking Deletion Foreign Key Constraint Issue
-- This migration ensures that when bookings are deleted, related room_issues are handled properly

-- 1. First, check if the room_issues table exists and has the correct constraint
-- If the constraint exists with the wrong behavior, we need to drop and recreate it

-- Drop the existing foreign key constraint if it exists
DO $$ 
BEGIN
    -- Check if the constraint exists and drop it
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'room_issues_booking_id_fkey' 
        AND table_name = 'room_issues'
    ) THEN
        ALTER TABLE public.room_issues DROP CONSTRAINT room_issues_booking_id_fkey;
        RAISE NOTICE 'Dropped existing room_issues_booking_id_fkey constraint';
    END IF;
END $$;

-- 2. Recreate the foreign key constraint with proper CASCADE behavior
-- We'll use ON DELETE SET NULL so that when a booking is deleted, 
-- the booking_id in room_issues becomes NULL but the issue record remains
ALTER TABLE public.room_issues 
ADD CONSTRAINT room_issues_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.bookings(id) 
ON DELETE SET NULL;

-- 3. Also ensure the check_in_events table has proper cascade behavior
-- Drop existing constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_in_events_booking_id_fkey' 
        AND table_name = 'check_in_events'
    ) THEN
        ALTER TABLE public.check_in_events DROP CONSTRAINT check_in_events_booking_id_fkey;
        RAISE NOTICE 'Dropped existing check_in_events_booking_id_fkey constraint';
    END IF;
END $$;

-- Recreate with CASCADE behavior for check_in_events
-- When a booking is deleted, related check-in events should also be deleted
ALTER TABLE public.check_in_events 
ADD CONSTRAINT check_in_events_booking_id_fkey 
FOREIGN KEY (booking_id) 
REFERENCES public.bookings(id) 
ON DELETE CASCADE;

-- 4. Add a function to safely delete bookings with proper cleanup
CREATE OR REPLACE FUNCTION public.safe_delete_booking(booking_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    booking_exists BOOLEAN;
BEGIN
    -- Check if booking exists
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE id = booking_id_param) INTO booking_exists;
    
    IF NOT booking_exists THEN
        RAISE EXCEPTION 'Booking with ID % does not exist', booking_id_param;
    END IF;
    
    -- Log the deletion attempt
    RAISE NOTICE 'Attempting to delete booking %', booking_id_param;
    
    -- The foreign key constraints will handle the cleanup automatically:
    -- - room_issues.booking_id will be set to NULL
    -- - check_in_events records will be deleted
    DELETE FROM public.bookings WHERE id = booking_id_param;
    
    -- Verify deletion
    SELECT EXISTS(SELECT 1 FROM public.bookings WHERE id = booking_id_param) INTO booking_exists;
    
    IF booking_exists THEN
        RAISE EXCEPTION 'Failed to delete booking %', booking_id_param;
    END IF;
    
    RAISE NOTICE 'Successfully deleted booking %', booking_id_param;
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error deleting booking %: %', booking_id_param, SQLERRM;
END;
$$;

-- 5. Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.safe_delete_booking(UUID) TO authenticated;

-- 6. Add comments for documentation
COMMENT ON FUNCTION public.safe_delete_booking(UUID) IS 'Safely deletes a booking with proper cleanup of related records';

-- 7. Verify the constraints are properly set
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    -- Check room_issues constraint
    SELECT 
        tc.constraint_name,
        rc.delete_rule
    INTO constraint_info
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'room_issues' 
    AND tc.constraint_name = 'room_issues_booking_id_fkey';
    
    IF FOUND THEN
        RAISE NOTICE 'room_issues constraint: % with delete rule: %', constraint_info.constraint_name, constraint_info.delete_rule;
    ELSE
        RAISE WARNING 'room_issues booking constraint not found!';
    END IF;
    
    -- Check check_in_events constraint
    SELECT 
        tc.constraint_name,
        rc.delete_rule
    INTO constraint_info
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    WHERE tc.table_name = 'check_in_events' 
    AND tc.constraint_name = 'check_in_events_booking_id_fkey';
    
    IF FOUND THEN
        RAISE NOTICE 'check_in_events constraint: % with delete rule: %', constraint_info.constraint_name, constraint_info.delete_rule;
    ELSE
        RAISE WARNING 'check_in_events booking constraint not found!';
    END IF;
END $$;
