-- Fix OAuth user creation database trigger
-- This addresses the database error when OAuth users sign up
-- Updated to match your EXACT database schema

-- First, let's drop the existing trigger and function to recreate them
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the corrected function that works with your actual schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_organization TEXT;
  user_position TEXT;
  auth_provider TEXT;
  is_oauth_user BOOLEAN;
BEGIN
  -- Determine the authentication provider
  auth_provider := COALESCE(
    NEW.app_metadata->>'provider',
    'email'
  );
  
  -- Check if this is an OAuth user
  is_oauth_user := auth_provider != 'email';
  
  -- Extract name from user metadata with provider-specific logic
  user_name := CASE 
    WHEN auth_provider = 'azure' THEN
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.user_metadata->>'full_name',
        NEW.user_metadata->>'name',
        split_part(NEW.email, '@', 1)
      )
    WHEN auth_provider = 'google' THEN
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.user_metadata->>'full_name',
        NEW.user_metadata->>'name',
        split_part(NEW.email, '@', 1)
      )
    ELSE -- email/password signup
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.user_metadata->>'name',
        split_part(NEW.email, '@', 1)
      )
  END;
  
  -- Extract organization (matching your actual database schema)
  user_organization := CASE 
    WHEN is_oauth_user THEN
      COALESCE(
        NEW.raw_user_meta_data->>'organization',
        NEW.raw_user_meta_data->>'department',
        NEW.user_metadata->>'organization',
        NEW.user_metadata->>'department',
        'OAuth - Pending' -- Mark as pending for profile completion
      )
    ELSE
      COALESCE(
        NEW.raw_user_meta_data->>'organization',
        NEW.raw_user_meta_data->>'department',
        NEW.user_metadata->>'organization',
        NEW.user_metadata->>'department'
      )
  END;
  
  -- Extract position/job title
  user_position := CASE 
    WHEN is_oauth_user THEN
      COALESCE(
        NEW.raw_user_meta_data->>'job_title',
        NEW.raw_user_meta_data->>'position',
        NEW.user_metadata->>'job_title',
        NEW.user_metadata->>'position',
        'OAuth - Pending' -- Mark as pending for profile completion
      )
    ELSE
      COALESCE(
        NEW.raw_user_meta_data->>'position',
        NEW.raw_user_meta_data->>'job_title',
        NEW.user_metadata->>'position',
        NEW.user_metadata->>'job_title'
      )
  END;

  -- Insert user record using your EXACT database schema
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    role, 
    organization,        -- Using 'organization' as per your actual schema
    position, 
    phone,              -- NULL by default
    profile_image,      -- NULL by default
    date_created, 
    last_login,
    status,             -- Default to 'active'
    auth_provider,      -- Track the auth provider
    email_verified      -- OAuth users are auto-verified
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    'user',             -- Default role
    user_organization,
    user_position,
    NULL,               -- phone
    NULL,               -- profile_image
    NOW(),              -- date_created
    NOW(),              -- last_login
    'active',           -- status
    auth_provider,      -- auth_provider
    is_oauth_user       -- email_verified (true for OAuth, false for email signup)
  );
  
  -- Log the user creation for debugging
  RAISE LOG 'Created user: id=%, email=%, provider=%, verified=%, name=%, org=%', 
    NEW.id, NEW.email, auth_provider, is_oauth_user, user_name, user_organization;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error details for debugging
    RAISE LOG 'Error in handle_new_user: %, User: %, Email: %', SQLERRM, NEW.id, NEW.email;
    -- Re-raise the error so it gets reported
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger is working by testing it
-- Note: This will be shown in logs when OAuth users sign up

COMMENT ON FUNCTION public.handle_new_user() IS 'Enhanced user creation function that properly handles OAuth vs email/password authentication, eliminating verification requirements for OAuth users and matching the actual database schema';
