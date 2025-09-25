# Fix Supabase Authentication Issue

## The Problem
`auth.uid()` returns `null` even when user is logged in, which means:
- The JWT token is not being properly passed to Supabase
- The database policies can't identify the current user
- All RLS policies fail because they can't verify user identity

## Root Causes & Solutions

### 1. Missing Authorization Header (Most Likely)
**Problem**: The API calls aren't including the JWT token in headers.

**Check**: Look at your meeting invitation API calls - do they include:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 2. Token Storage Issue
**Problem**: Token isn't being stored/retrieved correctly.

**Check**: In browser dev tools → Application → Local Storage:
- Look for `auth-token` or similar
- Verify it contains a valid JWT token

### 3. Supabase Client Configuration
**Problem**: Server-side Supabase client isn't configured to use the token.

**Fix**: In your API route, ensure you're using the token:
```javascript
// In API route
const token = request.headers.get('authorization')?.replace('Bearer ', '')
const supabase = createClient(url, anonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
})
```

### 4. Environment Variables
**Problem**: Missing or incorrect Supabase environment variables.

**Check**: Verify these are set correctly:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Quick Tests

### Test 1: Check Token in Browser
1. Open browser dev tools
2. Go to Application → Local Storage
3. Look for authentication token
4. Verify it's a valid JWT (starts with `eyJ`)

### Test 2: Check API Headers
1. Open Network tab in dev tools
2. Try to send invitation
3. Check the request headers
4. Verify `Authorization: Bearer <token>` is present

### Test 3: Manual Token Test
In Supabase SQL editor, you can test with a hardcoded user ID:
```sql
-- Test with a real user ID from your users table
SELECT id, email FROM users LIMIT 1;
-- Copy a real user ID and test:

-- Temporarily bypass auth for testing
CREATE POLICY "Temp bypass auth"
ON public.meeting_invitations
FOR INSERT
WITH CHECK (organizer_id = 'PASTE_REAL_USER_ID_HERE');
```

## Recommended Fix Order

1. **First**: Use the temporary permissive policies (fix-auth-token-issue.sql)
2. **Test**: See if invitations work with permissive policies
3. **Debug**: Check browser dev tools for token issues
4. **Fix**: Address the root authentication problem
5. **Restore**: Implement proper security policies once auth works

## IMMEDIATE ACTION
Run the `fix-auth-token-issue.sql` to get your system working, then we can debug the auth issue properly.
