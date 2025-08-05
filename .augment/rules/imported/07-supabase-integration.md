---
type: "always_apply"
---

# Supabase Integration

This document outlines how Supabase is integrated into the Conference Hub application, covering authentication, database access, and security considerations.

## Overview

Supabase serves as the backend for the Conference Hub application, providing:

1. **Authentication** - User registration, login, and session management
2. **Database** - PostgreSQL database for storing application data
3. **Row Level Security (RLS)** - Fine-grained access control at the database level
4. **Storage** - File storage for images and attachments (if needed)

## Supabase Client Setup

The Supabase client is initialized in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for operations that bypass RLS
export function createAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, supabaseServiceKey)
}
```

## Authentication Implementation

Authentication is managed through the `AuthContext` in `contexts/auth-context.tsx`, which provides:

1. **User State** - Current authenticated user information
2. **Login Function** - Email/password authentication
3. **Signup Function** - User registration with profile creation
4. **Logout Function** - Session termination

The context uses Supabase Auth methods and maintains the user state:

```typescript
// Example of login implementation
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error("Login error:", error.message)
      return false
    }
    
    // Map Supabase user to our AuthUser type
    const authUser = await mapSupabaseUser(data.session)
    setUser(authUser)
    return true
  } catch (error) {
    console.error("Login error:", error)
    return false
  }
}
```

## Database Schema

The application uses the following tables in Supabase:

1. **users** - User profiles linked to auth.users
2. **rooms** - Conference room information
3. **bookings** - Room booking records
4. **resources** - Equipment and resources

## Data Access Layer

The data access layer is implemented in `lib/supabase-data.ts`, which provides functions for:

1. **User Operations** - getUsers, getUserById, getUserByEmail
2. **Room Operations** - getRooms, getRoomById, createRoom, updateRoom, deleteRoom
3. **Booking Operations** - getBookings, getBookingById, createBooking, updateBooking
4. **Resource Operations** - getResources, getResourceById, createResource, updateResource, deleteResource
5. **Admin Operations** - adminGetAllUsers, adminGetAllBookings
6. **Utility Functions** - checkBookingConflicts, getAvailableRooms

Each function follows a consistent pattern:

```typescript
export async function functionName(params): Promise<ReturnType> {
  try {
    // Supabase query
    const { data, error } = await supabase
      .from('table')
      .select('*')
      // Additional query parameters
      
    if (error) {
      console.error('Error message:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in functionName:', error)
    throw error
  }
}
```

## Row Level Security (RLS)

Row Level Security policies are implemented in Supabase to enforce access control:

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Rooms Table Policies

```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- All users can view rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

-- Only admins can insert/update/delete rooms
CREATE POLICY "Only admins can insert rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
```

Similar policies are implemented for bookings and resources tables.

## Database Triggers

A trigger is used to automatically create a user profile when a new user signs up:

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

## Admin Operations

For operations that need to bypass RLS (admin-only operations), we use a service role key:

```typescript
export async function adminGetAllUsers(): Promise<User[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      
    if (error) {
      console.error('Admin error fetching users:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in adminGetAllUsers:', error)
    throw error
  }
}
```

## Best Practices for Supabase Integration

1. **Security**
   - Never expose the service role key in client-side code
   - Use RLS policies to enforce access control
   - Validate inputs before sending to Supabase

2. **Error Handling**
   - Always check for errors in Supabase responses
   - Log errors with appropriate context
   - Provide user-friendly error messages

3. **Performance**
   - Use appropriate indexes on frequently queried columns
   - Limit the columns selected to those needed
   - Use pagination for large result sets

4. **Data Integrity**
   - Use database constraints to enforce data rules
   - Implement validation on both client and server
   - Use transactions for operations that modify multiple tables

## Environment Variables

The following environment variables are required for Supabase integration:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The first two are public and can be included in client-side code, while the service role key should only be used in secure server environments.

## Authentication Flow

1. **User Registration**
   - User submits registration form
   - Client calls `signup` function in AuthContext
   - Supabase creates auth user and triggers database function
   - Database function creates user profile in users table
   - User is logged in automatically

2. **User Login**
   - User submits login form
   - Client calls `login` function in AuthContext
   - Supabase validates credentials and returns session
   - Client stores session and fetches user profile
   - User state is updated in AuthContext

3. **Session Management**
   - Supabase handles session persistence
   - AuthContext checks for existing session on mount
   - Session refresh is handled automatically by Supabase

By following these patterns and best practices, the Conference Hub application maintains a secure, efficient, and maintainable integration with Supabase. # Supabase Integration

This document outlines how Supabase is integrated into the Conference Hub application, covering authentication, database access, and security considerations.

## Overview

Supabase serves as the backend for the Conference Hub application, providing:

1. **Authentication** - User registration, login, and session management
2. **Database** - PostgreSQL database for storing application data
3. **Row Level Security (RLS)** - Fine-grained access control at the database level
4. **Storage** - File storage for images and attachments (if needed)

## Supabase Client Setup

The Supabase client is initialized in `lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client for operations that bypass RLS
export function createAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  return createClient(supabaseUrl, supabaseServiceKey)
}
```

## Authentication Implementation

Authentication is managed through the `AuthContext` in `contexts/auth-context.tsx`, which provides:

1. **User State** - Current authenticated user information
2. **Login Function** - Email/password authentication
3. **Signup Function** - User registration with profile creation
4. **Logout Function** - Session termination

The context uses Supabase Auth methods and maintains the user state:

```typescript
// Example of login implementation
const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error("Login error:", error.message)
      return false
    }
    
    // Map Supabase user to our AuthUser type
    const authUser = await mapSupabaseUser(data.session)
    setUser(authUser)
    return true
  } catch (error) {
    console.error("Login error:", error)
    return false
  }
}
```

## Database Schema

The application uses the following tables in Supabase:

1. **users** - User profiles linked to auth.users
2. **rooms** - Conference room information
3. **bookings** - Room booking records
4. **resources** - Equipment and resources

## Data Access Layer

The data access layer is implemented in `lib/supabase-data.ts`, which provides functions for:

1. **User Operations** - getUsers, getUserById, getUserByEmail
2. **Room Operations** - getRooms, getRoomById, createRoom, updateRoom, deleteRoom
3. **Booking Operations** - getBookings, getBookingById, createBooking, updateBooking
4. **Resource Operations** - getResources, getResourceById, createResource, updateResource, deleteResource
5. **Admin Operations** - adminGetAllUsers, adminGetAllBookings
6. **Utility Functions** - checkBookingConflicts, getAvailableRooms

Each function follows a consistent pattern:

```typescript
export async function functionName(params): Promise<ReturnType> {
  try {
    // Supabase query
    const { data, error } = await supabase
      .from('table')
      .select('*')
      // Additional query parameters
      
    if (error) {
      console.error('Error message:', error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error('Exception in functionName:', error)
    throw error
  }
}
```

## Row Level Security (RLS)

Row Level Security policies are implemented in Supabase to enforce access control:

### Users Table Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
  ON users FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);
```

### Rooms Table Policies

```sql
-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- All users can view rooms
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

-- Only admins can insert/update/delete rooms
CREATE POLICY "Only admins can insert rooms"
  ON rooms FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
```

Similar policies are implemented for bookings and resources tables.

## Database Triggers

A trigger is used to automatically create a user profile when a new user signs up:

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

## Admin Operations

For operations that need to bypass RLS (admin-only operations), we use a service role key:

```typescript
export async function adminGetAllUsers(): Promise<User[]> {
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      
    if (error) {
      console.error('Admin error fetching users:', error)
      throw error
    }
    
    return data || []
  } catch (error) {
    console.error('Exception in adminGetAllUsers:', error)
    throw error
  }
}
```

## Best Practices for Supabase Integration

1. **Security**
   - Never expose the service role key in client-side code
   - Use RLS policies to enforce access control
   - Validate inputs before sending to Supabase

2. **Error Handling**
   - Always check for errors in Supabase responses
   - Log errors with appropriate context
   - Provide user-friendly error messages

3. **Performance**
   - Use appropriate indexes on frequently queried columns
   - Limit the columns selected to those needed
   - Use pagination for large result sets

4. **Data Integrity**
   - Use database constraints to enforce data rules
   - Implement validation on both client and server
   - Use transactions for operations that modify multiple tables

## Environment Variables

The following environment variables are required for Supabase integration:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The first two are public and can be included in client-side code, while the service role key should only be used in secure server environments.

## Authentication Flow

1. **User Registration**
   - User submits registration form
   - Client calls `signup` function in AuthContext
   - Supabase creates auth user and triggers database function
   - Database function creates user profile in users table
   - User is logged in automatically

2. **User Login**
   - User submits login form
   - Client calls `login` function in AuthContext
   - Supabase validates credentials and returns session
   - Client stores session and fetches user profile
   - User state is updated in AuthContext

3. **Session Management**
   - Supabase handles session persistence
   - AuthContext checks for existing session on mount
   - Session refresh is handled automatically by Supabase

By following these patterns and best practices, the Conference Hub application maintains a secure, efficient, and maintainable integration with Supabase. 