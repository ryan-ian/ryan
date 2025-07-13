import { type NextRequest, NextResponse } from "next/server"
import { getBookings, getBookingsByUserId, createBooking, getRoomById, checkBookingConflicts } from "@/lib/supabase-data"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid
    
    // Get all bookings (in a real app, we would check if admin or regular user)
    const bookings = await getBookings()
    
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
    // For simplicity, we're assuming the token is valid and user_id is "user_1"
    const userId = "user_1" // In a real app, this would come from the authenticated user

    const bookingData = await request.json()

    // Check if room exists and is available
    const room = await getRoomById(bookingData.roomId)
    if (!room || room.status !== "available") {
      return NextResponse.json({ error: "Room not available" }, { status: 400 })
    }

    // Check for conflicts
    const startTime = bookingData.startTime
    const endTime = bookingData.endTime
    
    const hasConflict = await checkBookingConflicts(bookingData.roomId, startTime, endTime)
    if (hasConflict) {
      return NextResponse.json({ error: "Room is already booked for this time slot" }, { status: 409 })
    }

    // Create the booking
    const newBooking = await createBooking({
      room_id: bookingData.roomId,
      user_id: userId,
      title: bookingData.title,
      description: bookingData.description || null,
      start_time: startTime,
      end_time: endTime,
      attendees: bookingData.attendees || null,
      status: "confirmed",
      resources: bookingData.resources || null
    })

    return NextResponse.json(newBooking, { status: 201 })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
