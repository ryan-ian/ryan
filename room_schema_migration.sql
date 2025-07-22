-- Migration script to rename features column to room_resources and change its type to UUID array

-- 1. Create a temporary table to store existing room data
CREATE TEMP TABLE temp_rooms AS
SELECT id, name, location, capacity, status, image, description
FROM public.rooms;

-- 2. Add room_resources column to rooms table
ALTER TABLE public.rooms 
ADD COLUMN room_resources uuid[] DEFAULT '{}';

-- 3. Import existing resource assignments from room_resources junction table
UPDATE public.rooms r
SET room_resources = subquery.resource_ids
FROM (
  SELECT room_id, ARRAY_AGG(resource_id) as resource_ids
  FROM public.room_resources
  GROUP BY room_id
) AS subquery
WHERE r.id = subquery.room_id;

-- 4. Drop the features column (after ensuring data is migrated if needed)
ALTER TABLE public.rooms DROP COLUMN features;

-- 5. Drop the room_resources junction table
DROP TABLE IF EXISTS public.room_resources;

-- 6. Add RLS policy for rooms table to allow resource management
CREATE POLICY "Allow admins to manage room resources" 
ON public.rooms 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Note: This migration will lose any data that was stored in the features column.
-- If features data needs to be preserved, you should export it before running this script. 