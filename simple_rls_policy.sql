-- First, make sure RLS is enabled on the rooms table
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies on the rooms table to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can insert rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can update rooms" ON rooms;
DROP POLICY IF EXISTS "Admins can delete rooms" ON rooms;

-- Allow all users to view rooms
CREATE POLICY "Anyone can view rooms" 
  ON rooms FOR SELECT 
  USING (true);

-- Allow any authenticated user to insert rooms (for testing)
CREATE POLICY "Any authenticated user can insert rooms" 
  ON rooms FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- Allow any authenticated user to update rooms (for testing)
CREATE POLICY "Any authenticated user can update rooms" 
  ON rooms FOR UPDATE 
  TO authenticated
  USING (true);

-- Allow any authenticated user to delete rooms (for testing)
CREATE POLICY "Any authenticated user can delete rooms" 
  ON rooms FOR DELETE 
  TO authenticated
  USING (true);

-- Note: This is for testing only and should be replaced with proper role-based policies in production 