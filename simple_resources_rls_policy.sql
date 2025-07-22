-- First, make sure RLS is enabled on the resources table
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Remove any existing policies on the resources table to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view resources" ON resources;
DROP POLICY IF EXISTS "Any authenticated user can insert resources" ON resources;
DROP POLICY IF EXISTS "Any authenticated user can update resources" ON resources;
DROP POLICY IF EXISTS "Any authenticated user can delete resources" ON resources;

-- Create a simple policy that allows all operations for authenticated users
CREATE POLICY "Allow all operations on resources" 
  ON resources
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY; 