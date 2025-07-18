import { type NextRequest, NextResponse } from "next/server"
import { getBookingById, updateBooking, getRoomById } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"
import { 
  createBookingConfirmationNotification, 
  createBookingRejectionNotification 
} from "@/lib/notifications"

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
    
    // Send notifications if status has changed
    if (updateData.status && updateData.status !== existingBooking.status) {
      try {
        // Get room details for the notification
        const room = await getRoomById(existingBooking.room_id)
        const roomName = room?.name || "Unknown Room"
        
        // Send confirmation notification
        if (updateData.status === "confirmed" && existingBooking.status === "pending") {
          await createBookingConfirmationNotification(
            existingBooking.user_id,
            bookingId,
            existingBooking.title,
            roomName
          )
        }
        
        // Send rejection notification
        if (updateData.status === "cancelled" && existingBooking.status === "pending") {
          await createBookingRejectionNotification(
            existingBooking.user_id,
            bookingId,
            existingBooking.title,
            roomName,
            updateData.rejection_reason || undefined
          )
        }
      } catch (notificationError) {
        // Log the error but don't fail the request
        console.error("Failed to send notification:", notificationError)
      }
    }
    
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
    
    // Delete the booking from the database
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', bookingId)
      
    if (error) {
      console.error(`Error deleting booking ${bookingId}:`, error)
      return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, message: "Booking deleted successfully" })
  } catch (error) {
    console.error("Delete booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 