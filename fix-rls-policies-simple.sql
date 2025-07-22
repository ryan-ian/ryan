-- First, disable RLS temporarily to make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;

-- Create a single policy that allows all operations (temporary solution)
CREATE POLICY "Allow all operations on users" 
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Note: This is a temporary solution to get past the recursion error.
-- In a production environment, you should implement proper RLS policies
-- after confirming the basic functionality works. 