CREATE TABLE facilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Function to update the updated_at timestamp on every update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = timezone('utc'::text, now()); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to call the function before any update on facilities table
CREATE TRIGGER update_facilities_updated_at
BEFORE UPDATE ON facilities
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column(); 