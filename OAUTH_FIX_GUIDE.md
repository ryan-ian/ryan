# OAuth User Creation Fix Guide

You're experiencing a database error when OAuth users sign up. This is caused by a mismatch between your database trigger function and the actual database schema.

## The Issue

The error `Database error saving new user` occurs because:

1. **Schema Mismatch**: Your Supabase schema uses `department` but your TypeScript types expect `organization`
2. **Missing Status Column**: The trigger might be trying to insert into a `status` column that doesn't exist
3. **Trigger Function**: The current trigger function doesn't match your actual database schema

## Quick Fix Steps

### Step 1: Run the Debug Script

First, run the debug script to understand your current database state:

```sql
-- Run this in your Supabase SQL Editor
-- Copy the content from debug-oauth-issue.sql
```

### Step 2: Apply the Database Fix

Run the corrected trigger function:

```sql
-- Run this in your Supabase SQL Editor
-- Copy the content from fix-oauth-database-trigger.sql
```

### Step 3: Test the Fix

1. Try the Microsoft OAuth sign-in again
2. Check if users are created successfully
3. Verify the OAuth callback works correctly

## Detailed Analysis

### Current Database Schema (from Supabase)
```sql
users table columns:
- id: string
- name: string  
- email: string
- role: "admin" | "user"
- department: string  -- NOT "organization"
- position: string
- phone: string | null
- profile_image: string | null
- date_created: string
- last_login: string
```

### Your TypeScript Types (from code)
```typescript
interface User {
  id: string
  name: string
  email: string
  role: "admin" | "facility_manager" | "user"
  status?: "active" | "inactive" | "suspended" | "locked"
  organization: string  -- Should be "department"
  position: string
  // ... other fields
}
```

### The Mismatch

- **Database uses**: `department`
- **Code expects**: `organization`
- **Result**: Trigger fails when trying to insert OAuth users

## Long-term Solutions

### Option 1: Update Database Schema (Recommended)
```sql
-- Rename department column to organization
ALTER TABLE public.users RENAME COLUMN department TO organization;

-- Update your Supabase types accordingly
```

### Option 2: Update TypeScript Types
```typescript
// Change all references from 'organization' to 'department'
interface User {
  // ...
  department: string  // Changed from 'organization'
  // ...
}
```

### Option 3: Add Missing Columns
```sql
-- Add status column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add other missing columns as needed
```

## Testing the Fix

After applying the fix:

1. **Test OAuth Sign-in**: Try Microsoft OAuth again
2. **Check User Creation**: Verify users appear in database
3. **Check Profile Completion**: Ensure OAuth users get "OAuth - Pending" values
4. **Test Role-based Routing**: Verify users get redirected correctly

## Verification Queries

```sql
-- Check if trigger is working
SELECT trigger_name, event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- Check recent OAuth users
SELECT id, email, name, department, position, date_created
FROM public.users 
WHERE department = 'OAuth - Pending'
ORDER BY date_created DESC;

-- Check auth.users vs public.users sync
SELECT COUNT(*) as auth_users FROM auth.users;
SELECT COUNT(*) as public_users FROM public.users;
```

## Expected Behavior After Fix

1. **OAuth User Signs In**: Redirected to Microsoft/Google
2. **Returns to App**: Supabase processes OAuth 
3. **Trigger Creates User**: Database trigger creates user record with:
   - `department = 'OAuth - Pending'`
   - `position = 'OAuth - Pending'`
   - No email verification required
4. **Profile Completion**: User redirected to complete profile if needed
5. **Dashboard Access**: User can access the application

## If You Still Have Issues

1. **Check Supabase Logs**: Look for trigger errors in your Supabase dashboard
2. **Verify RLS Policies**: Ensure Row Level Security isn't blocking insertions
3. **Check Column Names**: Confirm your actual database schema matches the trigger
4. **Test Manually**: Try creating a user record manually in SQL editor

The fix should resolve the OAuth authentication issue and allow users to sign in with Microsoft successfully.
