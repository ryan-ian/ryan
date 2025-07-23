-- Step 1: Drop the old RLS policies that depend on the facility_managers table.
-- The policy names are taken from the error message you provided.
DROP POLICY IF EXISTS "Facility managers can view their facilities" ON public.facilities;
DROP POLICY IF EXISTS "Facility managers can manage rooms in their facilities" ON public.rooms;
DROP POLICY IF EXISTS "Facility managers can view and manage bookings for their facili" ON public.bookings;

-- Step 2: Now it's safe to drop the facility_managers table.
DROP TABLE IF EXISTS public.facility_managers;

-- Step 3: Add the manager_id column to the facilities table.
ALTER TABLE public.facilities
ADD COLUMN manager_id UUID;

-- Step 4: Add a foreign key constraint to link manager_id to the users table.
ALTER TABLE public.facilities
ADD CONSTRAINT facilities_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON DELETE SET NULL;

-- Step 5: Add a UNIQUE constraint to the manager_id column.
ALTER TABLE public.facilities
ADD CONSTRAINT facilities_manager_id_key UNIQUE (manager_id);

-- Step 6: Create new RLS policies based on the new schema.

-- This helper function is needed for the policies below.
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT role FROM public.users WHERE id = user_id;
$$;

-- Policy for facilities: Managers can manage their own facility, Admins can manage all.
CREATE POLICY "Users can manage their own facilities"
ON public.facilities
FOR ALL
USING (auth.uid() = manager_id OR get_user_role(auth.uid()) = 'admin')
WITH CHECK (auth.uid() = manager_id OR get_user_role(auth.uid()) = 'admin');

-- Policy for rooms: Managers can manage rooms in their facility, Admins can manage all.
CREATE POLICY "Managers can manage rooms in their assigned facility"
ON public.rooms
FOR ALL
USING (
  get_user_role(auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.facilities
    WHERE public.facilities.id = public.rooms.facility_id
    AND public.facilities.manager_id = auth.uid()
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1 FROM public.facilities
    WHERE public.facilities.id = public.rooms.facility_id
    AND public.facilities.manager_id = auth.uid()
  )
);

-- Policy for bookings: Managers can manage bookings for rooms in their facility, Admins can manage all.
CREATE POLICY "Managers can manage bookings in their assigned facility"
ON public.bookings
FOR ALL
USING (
  get_user_role(auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1
    FROM public.rooms
    JOIN public.facilities ON public.rooms.facility_id = public.facilities.id
    WHERE public.rooms.id = public.bookings.room_id AND public.facilities.manager_id = auth.uid()
  )
)
WITH CHECK (
  get_user_role(auth.uid()) = 'admin' OR
  EXISTS (
    SELECT 1
    FROM public.rooms
    JOIN public.facilities ON public.rooms.facility_id = public.facilities.id
    WHERE public.rooms.id = public.bookings.room_id AND public.facilities.manager_id = auth.uid()
  )
);

-- Remember to enable RLS on your tables if you haven't already
-- ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY; 