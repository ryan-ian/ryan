# Fixing Infinite Refresh Loop

## Problem

The application was experiencing an infinite refresh loop when accessing the login pages. This was happening because:

1. The login form component was attempting to redirect users based on authentication state
2. The authentication check was triggering additional refreshes
3. There was inconsistent handling of the authentication token between components

## Solution

We implemented the following fixes:

### 1. Updated the Login Form Component

Added proper authentication state checking to prevent unnecessary redirects:

```typescript
// components/forms/login-form.tsx
export function LoginForm({ isAdmin = false, redirectPath }: LoginFormProps) {
  // Add state to track if we're checking auth
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Check if user is already authenticated on component mount
  useEffect(() => {
    const checkExistingAuth = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem("auth-token")
        
        if (token) {
          // Verify the token is valid
          const { data, error } = await supabase.auth.getUser(token)
          
          if (!error && data.user) {
            // Valid user, redirect
            router.push(redirectPath)
            return
          }
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    
    checkExistingAuth()
  }, [isAdmin, redirectPath, router])
  
  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  // Rest of component...
}
```

### 2. Enhanced Token Handling in Auth Context

Updated the authentication context to properly manage the token in localStorage:

```typescript
// contexts/auth-context.tsx

// In login function
const login = async (email: string, password: string, isAdmin: boolean = false): Promise<boolean> => {
  try {
    // ... existing code ...
    
    // Store the token in localStorage
    if (data.session?.access_token) {
      localStorage.setItem("auth-token", data.session.access_token)
    }
    
    // ... rest of function ...
  } catch (error) {
    // ... error handling ...
  }
}

// In logout function
const logout = async () => {
  await supabase.auth.signOut()
  localStorage.removeItem("auth-token")
  setUser(null)
}

// In initializeAuth function
const initializeAuth = async () => {
  try {
    // Check for existing token in localStorage
    const token = localStorage.getItem("auth-token")
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const authUser = await mapSupabaseUser(session)
      setUser(authUser)
    } else if (token) {
      // Try to use the token from localStorage if no active session
      try {
        const { data, error } = await supabase.auth.getUser(token)
        
        if (!error && data.user) {
          const authUser = await mapSupabaseUser({ user: data.user, access_token: token } as Session)
          setUser(authUser)
        } else {
          // Invalid token, remove it
          localStorage.removeItem("auth-token")
        }
      } catch (tokenError) {
        console.error("Error using stored token:", tokenError)
        localStorage.removeItem("auth-token")
      }
    }
    
    // ... rest of function ...
  } catch (error) {
    // ... error handling ...
  }
}
```

### 3. Improved API Route Error Handling

Updated the API route to handle errors more gracefully:

```typescript
// app/api/bookings/user/route.ts
export async function GET(request: NextRequest) {
  try {
    // Get the token from the Authorization header
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      console.error("No authorization token provided")
      return NextResponse.json({ error: "Authorization required", data: [] }, { status: 401 })
    }
    
    try {
      // Get the user from the token
      const { data: userData, error: userError } = await supabase.auth.getUser(token)
      
      if (userError || !userData.user) {
        console.error("Invalid token or user not found:", userError)
        return NextResponse.json({ error: "Invalid token", data: [] }, { status: 401 })
      }
      
      // ... rest of function ...
    } catch (error) {
      console.error("Error processing user token:", error)
      return NextResponse.json({ error: "Error processing authentication", data: [] }, { status: 500 })
    }
  } catch (error) {
    // ... error handling ...
  }
}
```

### 4. Prevented Unnecessary API Calls

Updated the bookings page to prevent unnecessary API calls that could trigger refresh loops:

```typescript
// app/conference-room-booking/bookings/page.tsx

// Only refresh bookings if we have a user and token
useEffect(() => {
  // Set up an interval to refresh bookings every 10 seconds
  const intervalId = setInterval(() => {
    // Only fetch if we have a user and a token
    const token = localStorage.getItem("auth-token")
    if (user?.id && token) {
      fetchBookings()
    }
  }, 10000)
  
  // Clean up interval on unmount
  return () => clearInterval(intervalId)
}, [user?.id]) // Add user?.id as dependency

// Check for token and user before fetching
const fetchBookings = async () => {
  try {
    // Check if we have a user and token before proceeding
    const token = localStorage.getItem("auth-token")
    if (!token || !user?.id) {
      console.log("Skipping fetchBookings: No token or user ID available")
      return
    }
    
    setLoading(true)
    
    // ... rest of function ...
  } catch (error) {
    // ... error handling ...
  }
}
```

## Benefits of the Fix

1. **Consistent Token Management**: The token is now consistently managed across the application, with proper storage and removal.

2. **Improved Authentication Flow**: The login form now properly checks for existing authentication before rendering.

3. **Prevented Unnecessary API Calls**: API calls are now only made when a user and token are available.

4. **Better Error Handling**: API errors are handled more gracefully, preventing refresh loops caused by error responses.

5. **Improved User Experience**: Users no longer experience infinite refreshes when accessing the login pages.

These changes ensure that the application's authentication flow works correctly and prevents the infinite refresh loop that was occurring. 