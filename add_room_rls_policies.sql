-- First, make sure RLS is enabled on the rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Allow all users to view rooms
CREATE POLICY "Anyone can view rooms" 
  ON rooms FOR SELECT 
  USING (true);

-- Allow admins to insert rooms
CREATE POLICY "Admins can insert rooms" 
  ON rooms FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to update rooms
CREATE POLICY "Admins can update rooms" 
  ON rooms FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to delete rooms
CREATE POLICY "Admins can delete rooms" 
  ON rooms FOR DELETE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Make sure bookings table has RLS enabled too
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view bookings
CREATE POLICY "Authenticated users can view bookings" 
  ON bookings FOR SELECT 
  TO authenticated
  USING (true);

-- Allow admins to view all bookings
CREATE POLICY "Admins can view all bookings" 
  ON bookings FOR SELECT 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow users to create their own bookings
CREATE POLICY "Users can create their own bookings" 
  ON bookings FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to create any booking
CREATE POLICY "Admins can create any booking" 
  ON bookings FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  ); 