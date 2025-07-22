-- Add resources column to rooms table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'rooms' AND column_name = 'resources'
    ) THEN
        ALTER TABLE rooms ADD COLUMN resources TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Update RLS policy for rooms table to ensure resources can be accessed
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Create or replace policy for selecting rooms
DROP POLICY IF EXISTS "Anyone can view rooms" ON rooms;
CREATE POLICY "Anyone can view rooms" 
  ON rooms FOR SELECT 
  USING (true);

-- Create or replace policy for inserting rooms
DROP POLICY IF EXISTS "Admins can insert rooms" ON rooms;
CREATE POLICY "Admins can insert rooms" 
  ON rooms FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create or replace policy for updating rooms
DROP POLICY IF EXISTS "Admins can update rooms" ON rooms;
CREATE POLICY "Admins can update rooms" 
  ON rooms FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Create or replace policy for deleting rooms
DROP POLICY IF EXISTS "Admins can delete rooms" ON rooms;
CREATE POLICY "Admins can delete rooms" 
  ON rooms FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Re-enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY; 