import { type NextRequest, NextResponse } from "next/server"
import { getBookingsByUserId, getUserBookingsWithDetails } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"

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
      
      const userId = userData.user.id
      console.log("User ID from token:", userId)
      
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
      console.error("Error processing user token:", error)
      return NextResponse.json({ error: "Error processing authentication", data: [] }, { status: 500 })
    }
  } catch (error) {
    console.error("Get user bookings error:", error)
    // Return an empty array with error status
    return NextResponse.json([], { status: 500 })
  }
} 