import { type NextRequest, NextResponse } from "next/server"
import { getBookings, getBookingsByUserId, createBooking, getRoomById, checkBookingConflicts, getBookingsWithDetails } from "@/lib/supabase-data"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

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
