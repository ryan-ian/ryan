-- Migration script to replace room_resources junction table with resources array in rooms table

-- 1. Create a temporary table to store existing room-resource relationships
CREATE TEMP TABLE temp_room_resources AS
SELECT room_id, ARRAY_AGG(resource_id) as resource_ids
FROM public.room_resources
GROUP BY room_id;

-- 2. Add resources column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN resources uuid[] DEFAULT '{}';

-- 3. Update rooms with their resources from the temporary table
UPDATE public.rooms r
SET resources = tr.resource_ids
FROM temp_room_resources tr
WHERE r.id = tr.room_id;

-- 4. Drop the room_resources table
DROP TABLE IF EXISTS public.room_resources;

-- 5. Add RLS policy for rooms table to allow resource management
CREATE POLICY "Allow admins to manage room resources" 
ON public.rooms 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Note: This migration will lose the quantity information that was stored in room_resources.
-- If quantity is important, you would need a more complex data structure. 