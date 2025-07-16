import { type NextRequest, NextResponse } from "next/server"
import { getBookings, getBookingsByUserId, createBooking, getRoomById, checkBookingConflicts, getBookingsWithDetails } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    const searchParams = request.nextUrl.searchParams
    
    // Extract query parameters
    const roomId = searchParams.get("roomId")
    const startTime = searchParams.get("start")
    const endTime = searchParams.get("end")
    const date = searchParams.get("date")
    
    // For room-specific booking queries with date only (for calendar view)
    if (roomId && date) {
      // Get bookings for a specific room on a specific date
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`
      
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startOfDay)
        .lte('end_time', endOfDay)
        .in('status', ['confirmed', 'pending'])
      
      if (error) {
        console.error('Error fetching room bookings for date:', error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // For room-specific booking queries with time range
    if (roomId && startTime && endTime) {
      // Get bookings for a specific room within a time range
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', roomId)
        .gte('start_time', startTime)
        .lte('end_time', endTime)
        .in('status', ['confirmed', 'pending'])
      
      if (error) {
        console.error('Error fetching room bookings:', error)
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
      }
      
      return NextResponse.json(data || [])
    }
    
    // For all other booking queries, require authentication
    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid
    
    // Get all bookings with user and room details
    const bookings = await getBookingsWithDetails()
    
    return NextResponse.json(bookings)
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid

    const bookingData = await request.json()
    console.log("Received booking data:", bookingData)
    
    // Check if room exists and is available
    const room = await getRoomById(bookingData.room_id)
    if (!room || room.status !== "available") {
      return NextResponse.json({ error: "Room not available" }, { status: 400 })
    }

    // Check for conflicts
    const start_time = bookingData.start_time
    const end_time = bookingData.end_time
    
    const hasConflict = await checkBookingConflicts(bookingData.room_id, start_time, end_time)
    if (hasConflict) {
      return NextResponse.json({ error: "Room is already booked for this time slot" }, { status: 409 })
    }

    // Create the booking
    const newBooking = await createBooking({
      room_id: bookingData.room_id,
      user_id: bookingData.user_id,
      title: bookingData.title,
      description: bookingData.description || null,
      start_time: start_time,
      end_time: end_time,
      attendees: bookingData.attendees || null,
      status: bookingData.status || "pending",
      resources: bookingData.resources || null
    })

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
