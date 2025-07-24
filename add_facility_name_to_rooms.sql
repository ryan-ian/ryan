-- Add facility_name column to rooms table
ALTER TABLE public.rooms
ADD COLUMN facility_name text;

-- Update existing rooms with facility names from the facilities table
UPDATE public.rooms AS r
SET facility_name = f.name
FROM public.facilities AS f
WHERE r.facility_id = f.id;

-- Add a trigger to keep facility_name updated when facility_id changes
CREATE OR REPLACE FUNCTION update_room_facility_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If facility_id is being set or updated
  IF NEW.facility_id IS NOT NULL THEN
    -- Fetch the facility name from the facilities table
    SELECT name INTO NEW.facility_name 
    FROM public.facilities 
    WHERE id = NEW.facility_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_room_update_or_insert
  BEFORE INSERT OR UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_room_facility_name(); 