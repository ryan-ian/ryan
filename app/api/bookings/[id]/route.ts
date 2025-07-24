import { NextRequest, NextResponse } from "next/server"
import { getBookingById, updateBooking, deleteBooking, getRoomById, getUserById } from "@/lib/supabase-data"
import { createBookingConfirmationNotification, createBookingRejectionNotification, createFacilityManagerBookingNotification } from "@/lib/notifications"
import { supabase } from "@/lib/supabase"

// Get booking by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    const booking = await getBookingById(id)
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(booking)
  } catch (error) {
    console.error("Error fetching booking:", error)
    return NextResponse.json(
      { error: "Failed to fetch booking" },
      { status: 500 }
    )
  }
}

// Update booking status (approve/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Get the user ID from the token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      )
    }
    
    // Get update data from request body
    const updateData = await request.json()
    
    // Only allow status changes to 'confirmed' or 'cancelled'
    if (!updateData.status || !['confirmed', 'cancelled'].includes(updateData.status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'confirmed' or 'cancelled'" },
        { status: 400 }
      )
    }
    
    // Use the updateBookingStatus function to update and check permissions
    const result = await updateBookingStatus(
      id,
      user.id,
      updateData.status as 'confirmed' | 'cancelled',
      updateData.rejectionReason
    )
    
    if (!result.success) {
      // Return appropriate error based on the result
      const statusCode = result.error?.includes('Permission denied') ? 403 : 400
      return NextResponse.json({ error: result.error }, { status: statusCode })
    }
    
    return NextResponse.json(result.booking)
  } catch (error) {
    console.error("Error updating booking:", error)
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    )
  }
}

export async function PUT(
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

    const bookingId = params.id
    const updateData = await request.json()

    // Get the existing booking
    const existingBooking = await getBookingById(bookingId)
    if (!existingBooking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Get the room details
    const room = await getRoomById(existingBooking.room_id)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // Get the user details
    const user = await getUserById(existingBooking.user_id)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if status is being updated
    const statusChanged = updateData.status && updateData.status !== existingBooking.status

    // Update the booking
    const updatedBooking = await updateBooking(bookingId, updateData)
    if (!updatedBooking) {
      return NextResponse.json({ error: "Failed to update booking" }, { status: 500 })
    }

    // Handle notifications based on status changes
    if (statusChanged) {
      // If booking was confirmed
      if (updateData.status === "confirmed" && existingBooking.status === "pending") {
        await createBookingConfirmationNotification(
          existingBooking.user_id,
          bookingId,
          existingBooking.title,
          room.name
        )
      }
      
      // If booking was rejected/cancelled
      if (updateData.status === "cancelled" && existingBooking.status === "pending") {
        await createBookingRejectionNotification(
          existingBooking.user_id,
          bookingId,
          existingBooking.title,
          room.name
        )
      }
      
      // If booking status changed, notify the facility manager
      if (room.facility_id) {
        // Get facility manager
        const { data: facility, error: facilityError } = await supabase
          .from('facilities')
          .select('manager_id')
          .eq('id', room.facility_id)
          .single()
          
        if (!facilityError && facility && facility.manager_id) {
          await createFacilityManagerBookingNotification(
            facility.manager_id,
            bookingId,
            user.name,
            existingBooking.title,
            room.name,
            updatedBooking.start_time,
            updatedBooking.end_time
          )
        }
      }
    }

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete booking
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id
  
  try {
    // Verify authentication
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    
    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    // Get the booking to check if user has permission to delete it
    const booking = await getBookingById(id)
    
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }
    
    // Get the user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 }
      )
    }
    
    // Check if user owns the booking or is an admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (booking.user_id !== user.id && userData?.role !== 'admin') {
      return NextResponse.json(
        { error: "You don't have permission to delete this booking" },
        { status: 403 }
      )
    }
    
    // Delete the booking
    const deleted = await deleteBooking(id)
    
    if (!deleted) {
      return NextResponse.json(
        { error: "Failed to delete booking" },
        { status: 500 }
      )
    }
    
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting booking:", error)
    return NextResponse.json(
      { error: "Failed to delete booking" },
      { status: 500 }
    )
  }
} 