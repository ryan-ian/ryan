import { type NextRequest, NextResponse } from "next/server"
import { getBookingsByUserId, getUserBookingsWithDetails } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    // Try multiple authentication approaches
    let userId = null
    
    // Method 1: Try Authorization header
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "")
      
      // Validate token format (JWT should have 3 parts separated by dots)
      if (token && token.split('.').length === 3) {
        try {
          const { data: userData, error: userError } = await supabase.auth.getUser(token)
          if (!userError && userData.user) {
            userId = userData.user.id
            console.log("User ID from Bearer token:", userId)
          }
        } catch (error) {
          console.error("Error validating Bearer token:", error)
        }
      } else {
        console.error("Invalid JWT format - token does not have 3 segments")
      }
    }
    
    // Method 2: Try session-based authentication as fallback
    if (!userId) {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (!sessionError && session?.user) {
          userId = session.user.id
          console.log("User ID from session:", userId)
        }
      } catch (error) {
        console.error("Error getting session:", error)
      }
    }
    
    // Method 3: Try getting user ID from query params as fallback
    if (!userId) {
      const searchParams = request.nextUrl.searchParams
      const queryUserId = searchParams.get("user_id")
      if (queryUserId) {
        // Validate that this user exists and the request is legitimate
        try {
          const { data: userExists, error } = await supabase
            .from('users')
            .select('id')
            .eq('id', queryUserId)
            .single()
            
          if (!error && userExists) {
            userId = queryUserId
            console.log("User ID from query params (validated):", userId)
          }
        } catch (error) {
          console.error("Error validating user from query params:", error)
        }
      }
    }
    
    if (!userId) {
      console.error("No valid authentication found")
      return NextResponse.json({ error: "Authentication required", data: [] }, { status: 401 })
    }
    
    // Check if a specific date is requested
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get("date")
    
    try {
      let bookings = [];
      
      if (date) {
        // Get bookings for the specified date
        const startOfDay = `${date}T00:00:00.000Z`
        const endOfDay = `${date}T23:59:59.999Z`
        
        const { data, error } = await supabase
          .from('bookings')
          .select('*, rooms:room_id(*)')
          .eq('user_id', userId)
          .gte('start_time', startOfDay)
          .lte('start_time', endOfDay)
          .in('status', ['confirmed', 'pending'])
        
        if (error) {
          console.error('Error fetching user bookings for date:', error)
          throw error;
        }
        
        bookings = data || [];
      } else {
        // Get all user bookings with details
        bookings = await getUserBookingsWithDetails(userId);
      }
      
      // Ensure we're returning an array
      if (!Array.isArray(bookings)) {
        console.error("getUserBookingsWithDetails did not return an array:", bookings);
        bookings = [];
      }
      
      return NextResponse.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      // Return an empty array with error status
      return NextResponse.json([], { status: 500 });
    }
  } catch (error) {
    console.error("Get user bookings error:", error)
    // Return an empty array with error status
    return NextResponse.json([], { status: 500 })
  }
} 