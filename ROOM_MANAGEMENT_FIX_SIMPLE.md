# Simple Fix for Room Management RLS Issues

You're encountering Row Level Security (RLS) policy violations when trying to create, update, or delete rooms. This is because the Supabase database has RLS enabled, but we need to add policies that allow admin users to perform these operations.

## Solution: Adding RLS Policies for Admin Users

We've simplified the approach by going back to direct table operations and adding proper RLS policies:

### Step 1: Run the SQL Script in Supabase

1. Log in to your Supabase dashboard
2. Go to the SQL Editor
3. Create a new query
4. Copy and paste the contents of the `add_room_rls_policies.sql` file
5. Run the query

This will add policies that:
- Allow anyone to view rooms
- Allow admin users to create, update, and delete rooms
- Ensure proper access control for bookings

### Step 2: Ensure You're Logged in as an Admin

For these operations to work:

1. Make sure you're logged in to the application as a user with the 'admin' role
2. The auth token must be properly set in localStorage

You can check if a user is an admin by running this SQL in the Supabase SQL Editor:

```sql
SELECT * FROM users WHERE role = 'admin';
```

If you don't have an admin user yet, you can create one:

```sql
-- First, find a user ID to make admin
SELECT id, email FROM users;

-- Then update that user to be an admin
UPDATE users
SET role = 'admin'
WHERE id = 'user-id-here';
```

### Step 3: Test the Room Management Features

After implementing the RLS policies:

1. Try creating a new room
2. Try updating an existing room
3. Try deleting a room (one without any bookings)

All these operations should now work without RLS errors.

## Troubleshooting

If you still encounter issues:

1. **Check Authentication**: Make sure you're properly authenticated and the token is being sent with requests

2. **Verify Admin Role**: Confirm your user account has the 'admin' role in the database

3. **Inspect RLS Policies**: In the Supabase dashboard, go to Database > Tables > rooms > Policies to verify the policies were created correctly

4. **Check for Errors**: Look at the browser console and server logs for specific error messages 