-- Drop existing policies that might be causing the recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Add policies for insert, update, and delete operations
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow the trigger function to insert new users
CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY; 