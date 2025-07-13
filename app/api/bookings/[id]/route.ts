import { type NextRequest, NextResponse } from "next/server"
import { getBookingById, updateBooking } from "@/lib/supabase-data"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid
    
    const booking = await getBookingById(params.id)
    
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    return NextResponse.json(booking)
  } catch (error) {
    console.error("Get booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and user is an admin
    
    const bookingId = params.id
    const bookingData = await request.json()
    
    // Validate booking exists
    const existingBooking = await getBookingById(bookingId)
    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    // Only allow status updates for now
    const allowedUpdates = ['status']
    const updates: Record<string, any> = {}
    
    for (const key of allowedUpdates) {
      if (bookingData[key] !== undefined) {
        updates[key] = bookingData[key]
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }
    
    // Update booking
    const updatedBooking = await updateBooking(bookingId, updates)
    
    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 