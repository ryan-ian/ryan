-- Migration: Rename department field to organization
-- This migration updates the users table and related database objects

-- 1. Rename the column in the users table
ALTER TABLE public.users RENAME COLUMN department TO organization;

-- 2. Update the database trigger function to use the new field name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, organization, position, date_created, last_login)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user', -- Default role
    new.raw_user_meta_data->>'organization',
    new.raw_user_meta_data->>'position',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update any indexes if they exist on the department column
-- (This is a safety check - drop and recreate if index exists)
DROP INDEX IF EXISTS idx_users_department;
CREATE INDEX IF NOT EXISTS idx_users_organization ON public.users(organization);

-- 4. Update RLS policies if they reference the department field
-- Note: Current policies don't seem to filter by department, but this is for future-proofing
-- If you have any custom policies that filter by department, update them here

-- 5. Update any views that might reference the department column
-- (Add any view updates here if needed)

-- Note: Run this migration in your Supabase dashboard SQL editor
-- Make sure to backup your data before running this migration
