# Supabase Authentication Setup

This guide will help you set up Supabase authentication for the Conference Hub application.

## 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up or log in
2. Create a new project
3. Give your project a name and set a secure database password
4. Select a region closest to your users
5. Wait for your project to be created

## 2. Understanding Supabase Auth

Supabase provides a built-in authentication system that handles:
- User registration and login
- Password hashing and security
- Session management
- OAuth providers (if needed)

The `auth.users` table is automatically created and managed by Supabase. We'll create a separate `users` table in our public schema that will store additional user profile information and link to the auth.users table via the user ID.

## 3. Set Up Database Tables

Create the following tables in your Supabase database:

### Users Table (Profile Information)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT,
  profile_image TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Rooms Table

```sql
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  features TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'maintenance', 'reserved')),
  image TEXT,
  description TEXT
);
```

### Bookings Table

```sql
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id),
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  attendees TEXT[],
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  resources TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Resources Table

```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'in-use', 'maintenance')),
  description TEXT
);
```

## 4. Configure Row Level Security (RLS)

To secure your data, enable Row Level Security on all tables and add appropriate policies:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Add policies for insert, update, and delete operations
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow the trigger function to insert new users
CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Similar policies for other tables...
```

## 5. Configure Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_url` and `your_supabase_anon_key` with the values from your Supabase project settings (API section).

## 6. Configure Authentication Settings

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Configure the following settings:
   - Enable Email/Password sign-in
   - Disable email confirmation if you want users to be able to sign in immediately
   - Configure redirect URLs for your application

## 7. Create Initial Admin User

You'll need at least one admin user to access the admin panel:

1. Create a new user through the signup form in your application
2. After the user is created, go to the SQL editor in Supabase and run:

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'admin@example.com';
```

Replace `admin@example.com` with the admin's email address.

## 8. Database Triggers for User Creation

To automatically create a user profile when someone signs up, add this trigger:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, department, position, date_created, last_login)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user', -- Default role
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'position',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

This trigger will automatically create a profile in the `users` table whenever someone signs up, using the metadata provided during registration.

## 9. Test Authentication

1. Start your application with `npm run dev`
2. Try to sign up a new user
3. Try to log in with the admin user
4. Verify that the admin can access the admin panel and regular users cannot 

## 10. Troubleshooting

### Missing Users in the Public Users Table

If you encounter errors like `Error fetching user data: {}` when logging in, it's likely that users exist in the `auth.users` table but not in the `public.users` table. This can happen if:

1. The database trigger wasn't set up correctly
2. Users were created before the trigger was established

To fix this issue:

1. Ensure the database trigger is properly set up by running the SQL in the `setup-trigger.sql` file:

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, department, position, date_created, last_login)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    'user', -- Default role
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'position',
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

2. For existing users that are missing from the public.users table, run the SQL in the `add-existing-users.sql` file:

```sql
INSERT INTO public.users (id, email, name, role, department, position, date_created, last_login)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'User ' || au.id::text),
  'user',
  COALESCE(au.raw_user_meta_data->>'department', 'Unassigned'),
  COALESCE(au.raw_user_meta_data->>'position', 'Unassigned'),
  now(),
  now()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;
```

3. To make a specific user an admin:

```sql
UPDATE public.users SET role = 'admin' WHERE email = 'your_admin_email@example.com';
```

After running these SQL commands, restart your application and try logging in again.

### Infinite Recursion in RLS Policies

If you encounter an error like `Error fetching user data: "infinite recursion detected in policy for relation \"users\""`, it means there's a circular reference in your Row Level Security (RLS) policies.

This typically happens when a policy for the users table tries to query the same users table to check permissions, creating an infinite loop.

#### Option 1: Simplify RLS Policies (Temporary Solution)

For quick testing, you can temporarily simplify the RLS policies by running:

```sql
-- First, disable RLS temporarily to make changes
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for the users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Admins can update any profile" ON users;
DROP POLICY IF EXISTS "Allow insert during signup" ON users;

-- Create a single policy that allows all operations (temporary solution)
CREATE POLICY "Allow all operations on users" 
  ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

#### Option 2: Update the Application Code

Another approach is to modify the auth-context.tsx file to handle recursion errors by falling back to using user metadata:

```typescript
// In mapSupabaseUser function
if (error) {
  console.error("Error fetching user data:", error.message || error)
  
  // If we get a recursion error, try a simpler approach
  if (error.message?.includes('recursion')) {
    // Create a basic user object from the session
    return {
      id: session.user.id,
      name: session.user.user_metadata?.name || 'User',
      email: session.user.email || '',
      role: session.user.user_metadata?.role || 'user',
      department: session.user.user_metadata?.department || 'Unassigned',
      position: session.user.user_metadata?.position || 'Unassigned'
    }
  }
  return null
}
```

Also, make sure to include the role in the user metadata when signing up:

```typescript
const { data: authData, error: authError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name: userData.name,
      department: userData.department,
      position: userData.position,
      role: 'user' // Add role to metadata as well
    }
  }
})
```

#### Option 3: Better RLS Policies (Production Solution)

For a production environment, use these non-recursive policies:

```sql
-- Drop existing policies that might be causing the recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Admin policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Add policies for insert, update, and delete operations
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON users FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow the trigger function to insert new users
CREATE POLICY "Allow insert during signup"
  ON users FOR INSERT
  WITH CHECK (true);

-- Make sure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```