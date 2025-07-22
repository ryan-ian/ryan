-- Create a function to allow creating rooms with admin privileges
-- This function bypasses RLS by using SECURITY DEFINER
CREATE OR REPLACE FUNCTION admin_create_room(
  room_name TEXT,
  room_location TEXT,
  room_capacity INTEGER,
  room_features TEXT[],
  room_status TEXT,
  room_image TEXT,
  room_description TEXT
) 
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the creator (should be the DB owner)
AS $$
DECLARE
  new_room_id UUID;
BEGIN
  -- Insert the new room
  INSERT INTO rooms (
    name, 
    location, 
    capacity, 
    features, 
    status, 
    image, 
    description
  ) 
  VALUES (
    room_name, 
    room_location, 
    room_capacity, 
    room_features, 
    room_status, 
    room_image, 
    room_description
  )
  RETURNING id INTO new_room_id;
  
  -- Return the ID of the newly created room
  RETURN new_room_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_create_room TO authenticated;

-- Similarly, create functions for updating and deleting rooms
CREATE OR REPLACE FUNCTION admin_update_room(
  room_id UUID,
  room_name TEXT,
  room_location TEXT,
  room_capacity INTEGER,
  room_features TEXT[],
  room_status TEXT,
  room_image TEXT,
  room_description TEXT
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE rooms
  SET 
    name = room_name,
    location = room_location,
    capacity = room_capacity,
    features = room_features,
    status = room_status,
    image = room_image,
    description = room_description
  WHERE id = room_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_room TO authenticated;

CREATE OR REPLACE FUNCTION admin_delete_room(room_id UUID) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_bookings BOOLEAN;
BEGIN
  -- Check if room has bookings
  SELECT EXISTS(
    SELECT 1 FROM bookings WHERE room_id = admin_delete_room.room_id LIMIT 1
  ) INTO has_bookings;
  
  -- If room has bookings, don't delete and return false
  IF has_bookings THEN
    RETURN FALSE;
  END IF;
  
  -- Delete the room
  DELETE FROM rooms WHERE id = room_id;
  
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_delete_room TO authenticated; 