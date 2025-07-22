-- First, check if RLS is enabled on the bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies on the bookings table to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can delete all bookings" ON bookings;

-- Allow users to view their own bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT 
  USING (auth.uid() = user_id);

-- Allow users to create bookings
CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own bookings
CREATE POLICY "Users can update their own bookings" 
  ON bookings FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow users to delete their own bookings
CREATE POLICY "Users can delete their own bookings"
  ON bookings FOR DELETE
  USING (auth.uid() = user_id);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings"
  ON bookings FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to update all bookings
CREATE POLICY "Admins can update all bookings"
  ON bookings FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to delete all bookings
CREATE POLICY "Admins can delete all bookings"
  ON bookings FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  ); 