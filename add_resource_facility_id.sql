-- Add facility_id column to resources table
ALTER TABLE public.resources ADD COLUMN facility_id UUID;

-- Add foreign key constraint
ALTER TABLE public.resources 
ADD CONSTRAINT resources_facility_id_fkey 
FOREIGN KEY (facility_id) REFERENCES public.facilities(id);

-- Create RLS policies for resources

-- Enable RLS on resources table if not already enabled
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might conflict
DROP POLICY IF EXISTS "Admin users can manage all resources" ON public.resources;
DROP POLICY IF EXISTS "Facility managers can manage resources for their facilities" ON public.resources;
DROP POLICY IF EXISTS "Users can view all resources" ON public.resources;

-- Create new policies
-- Admin can do anything with resources
CREATE POLICY "Admin users can manage all resources" 
ON public.resources 
FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Facility managers can manage resources for their facilities
CREATE POLICY "Facility managers can manage resources for their facilities" 
ON public.resources 
FOR ALL 
TO authenticated 
USING (
  auth.uid() IN (
    SELECT manager_id FROM public.facilities WHERE id = facility_id
  )
);

-- All users can view resources
CREATE POLICY "Users can view all resources" 
ON public.resources 
FOR SELECT 
TO authenticated 
USING (true); 





HI