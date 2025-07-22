-- Enable RLS on room_resources table
ALTER TABLE public.room_resources ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admins to manage room resources
CREATE POLICY "Allow admins to manage room resources" 
ON public.room_resources 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Create policy to allow all users to view room resources
CREATE POLICY "Allow all users to view room resources" 
ON public.room_resources 
FOR SELECT 
USING (true); 