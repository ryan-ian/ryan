# Authentication Token Fix

## Problem

The application was experiencing an issue with the authentication token in the API routes. Specifically, the `/api/bookings/user` route was not correctly extracting the user ID from the token, causing the following error:

```
TypeError: bookings.filter is not a function
```

This occurred because the API was trying to use `supabase.auth.getSession()` to get the current user's session, but this method doesn't work with the token passed from the client.

## Solution

We implemented the following fixes:

### 1. Created a New Login Form Component

Created a new `LoginForm` component in `components/forms/login-form.tsx` that properly stores the Supabase access token in localStorage:

```typescript
// components/forms/login-form.tsx
export function LoginForm({ isAdmin = false, redirectPath }: LoginFormProps) {
  // ...
  
  const handleSubmit = async (e: React.FormEvent) => {
    // ...
    try {
      // Sign in with Supabase directly
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      // ...
      
      // Store the token in localStorage
      localStorage.setItem("auth-token", data.session.access_token)
      
      // Redirect to the appropriate page
      router.push(redirectPath)
    } catch (error) {
      // ...
    }
  }
  
  // ...
}
```

### 2. Updated the API Route to Use the Token Correctly

Modified the `/api/bookings/user` route to properly extract the user ID from the authorization token:

```typescript
// app/api/bookings/user/route.ts
export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      console.error("No authorization token provided")
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }
    
    // Set the auth token for this request
    const supabaseWithAuth = supabase.auth.setSession({
      access_token: token,
      refresh_token: ""
    })
    
    // Get the user from the token
    const { data: userData, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !userData.user) {
      console.error("Invalid token or user not found:", userError)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    
    const userId = userData.user.id
    console.log("User ID from token:", userId)
    
    // ... rest of the function
  } catch (error) {
    // ...
  }
}
```

### 3. Updated the Login Pages

Updated both the user login and admin login pages to use the new `LoginForm` component:

```typescript
// app/user-login/page.tsx
import { LoginForm } from "@/components/forms/login-form"

export default function UserLoginPage() {
  return (
    // ...
    <CardContent className="pb-8">
      <LoginForm isAdmin={false} redirectPath="/conference-room-booking" />
      {/* ... */}
    </CardContent>
    // ...
  )
}
```

```typescript
// app/login/page.tsx
import { LoginForm } from "@/components/forms/login-form"

export default function AdminLoginPage() {
  return (
    // ...
    <CardContent className="pb-8">
      <LoginForm isAdmin={true} redirectPath="/admin" />
      {/* ... */}
    </CardContent>
    // ...
  )
}
```

## Benefits of the Fix

1. **Direct Token Authentication**: The API now correctly authenticates using the token from the client's Authorization header.

2. **Consistent Token Storage**: The login form component ensures that tokens are consistently stored in localStorage.

3. **Proper User Identification**: The API now correctly identifies the user from the token, preventing unauthorized access.

4. **Improved Error Handling**: Added detailed error logging to help identify authentication issues.

5. **Simplified Login Process**: The new login form component centralizes authentication logic, making it easier to maintain.

## How It Works

1. When a user logs in, the `LoginForm` component authenticates directly with Supabase and stores the access token in localStorage.

2. When making API requests, the client includes this token in the Authorization header.

3. The API route extracts the token and uses `supabase.auth.getUser(token)` to get the user's information.

4. The user ID from the token is then used to fetch the user's bookings.

This approach ensures that the API always has access to the correct user ID, even when the session cookie is not available or not properly synchronized. 