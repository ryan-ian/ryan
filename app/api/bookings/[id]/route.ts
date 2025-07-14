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
    // For simplicity, we're assuming the token is valid
    // In a real app, you would verify that the user has admin privileges

    const bookingId = params.id
    const updateData = await request.json()
    
    // Validate the update data
    if (updateData.status && !["pending", "confirmed", "cancelled"].includes(updateData.status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 })
    }
    
    // Get the existing booking to make sure it exists
    const existingBooking = await getBookingById(bookingId)
    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    // Update the booking
    const updatedBooking = await updateBooking(bookingId, {
      ...updateData,
      updated_at: new Date().toISOString()
    })
    
    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
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
    // In a real app, you would verify that the user has admin privileges

    const bookingId = params.id
    
    // Get the existing booking to make sure it exists
    const existingBooking = await getBookingById(bookingId)
    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }
    
    // Instead of deleting, we'll mark it as cancelled
    const updatedBooking = await updateBooking(bookingId, {
      status: "cancelled",
      updated_at: new Date().toISOString()
    })
    
    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Delete booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 