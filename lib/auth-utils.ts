import { supabase } from "@/lib/supabase"

/**
 * Gets a fresh authentication token, refreshing if necessary
 * @returns Promise<string | null> - Returns the token or null if not authenticated
 */
export async function getFreshAuthToken(): Promise<string | null> {
  try {
    // First, try to get the current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Error getting session:", error)
      return null
    }
    
    if (!session) {
      console.log("No active session found")
      return null
    }
    
    // Check if the token is expired or about to expire (within 60 seconds)
    const now = Math.floor(Date.now() / 1000)
    const expiresAt = session.expires_at || 0
    
    if (expiresAt - now < 60) {
      console.log("Token is expired or about to expire, refreshing...")
      
      // Try to refresh the session
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error("Error refreshing session:", refreshError)
        return null
      }
      
      if (refreshData.session?.access_token) {
        // Update localStorage with new token
        localStorage.setItem("auth-token", refreshData.session.access_token)
        console.log("Session refreshed successfully")
        return refreshData.session.access_token
      }
    }
    
    // Return the current valid token
    if (session.access_token) {
      // Update localStorage to ensure it's current
      localStorage.setItem("auth-token", session.access_token)
      return session.access_token
    }
    
    return null
  } catch (error) {
    console.error("Error in getFreshAuthToken:", error)
    return null
  }
}

/**
 * Makes an authenticated API request with automatic token handling
 * @param url - The API endpoint URL
 * @param options - Fetch options (will be merged with auth headers)
 * @returns Promise<Response>
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = await getFreshAuthToken()
  
  if (!token) {
    throw new Error("No valid authentication token available")
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers
  }
  
  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Clears authentication tokens and signs out
 */
export async function clearAuth(): Promise<void> {
  try {
    localStorage.removeItem("auth-token")
    await supabase.auth.signOut()
  } catch (error) {
    console.error("Error during sign out:", error)
  }
}
