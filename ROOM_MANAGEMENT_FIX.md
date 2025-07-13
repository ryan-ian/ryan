# Fix for Room Management RLS Issues

You're encountering Row Level Security (RLS) policy violations when trying to create, update, or delete rooms. This is because the Supabase database has RLS enabled, but we need to bypass it for admin operations.

## Solution: Using Database Functions to Bypass RLS

We've updated the code to use database functions (stored procedures) that run with elevated privileges to bypass RLS. Here's how to implement this fix:

### Step 1: Run the SQL Script in Supabase

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `create_room_function.sql` file
5. Run the query

This will create three functions:
- `admin_create_room` - For creating new rooms
- `admin_update_room` - For updating existing rooms
- `admin_delete_room` - For deleting rooms

These functions use `SECURITY DEFINER` which means they run with the privileges of the database owner, bypassing RLS.

### Step 2: Test the Room Management Features

After implementing the database functions and updating the code:

1. Try creating a new room
2. Try updating an existing room
3. Try deleting a room (one without any bookings)

All these operations should now work without RLS errors.

## Alternative Solutions

If the above solution doesn't work, here are some alternatives:

### Option 1: Modify RLS Policies

You can modify the RLS policies to allow admin users to perform these operations:

```sql
-- Allow admins to insert into rooms
CREATE POLICY "Admins can insert rooms" 
  ON rooms FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to update rooms
CREATE POLICY "Admins can update rooms" 
  ON rooms FOR UPDATE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );

-- Allow admins to delete rooms
CREATE POLICY "Admins can delete rooms" 
  ON rooms FOR DELETE 
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  );
```

### Option 2: Use Service Role Key

For server-side operations, you can use a service role key:

1. Get your service role key from Supabase (Settings > API)
2. Create a `.env.local` file (if it doesn't exist) with:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```
3. Modify `lib/supabase.ts` to use this key for admin operations:
```typescript
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey)
}
```

**IMPORTANT:** Never expose the service role key to the client side. Only use it in server-side API routes. 