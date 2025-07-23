CREATE TABLE facility_managers (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, facility_id)
);

-- Add comments to describe the table and columns
COMMENT ON TABLE facility_managers IS 'Maps users with the facility_manager role to the facilities they manage.';
COMMENT ON COLUMN facility_managers.user_id IS 'Foreign key to the users table.';
COMMENT ON COLUMN facility_managers.facility_id IS 'Foreign key to the facilities table.';
COMMENT ON COLUMN facility_managers.assigned_at IS 'Timestamp of when the user was assigned to the facility.'; 