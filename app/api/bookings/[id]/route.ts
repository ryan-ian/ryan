import { type NextRequest, NextResponse } from "next/server"
import { updateBooking } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"

// Inline implementation of deleteBooking function
async function deleteBooking(id: string): Promise<boolean> {
  try {
    console.log(`🗑️ [deleteBooking] Starting deletion of booking ${id}`)
    
    // First, get the booking to check if it can be deleted
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()
      
    if (fetchError) {
      console.error(`Error fetching booking ${id}:`, fetchError)
      return false
    }
    
    // Check if this is a confirmed booking and if it's within 24 hours of start time
    if (booking.status === 'confirmed') {
      const now = new Date()
      const startTime = new Date(booking.start_time)
      const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
      
      console.log(`🔍 [deleteBooking] Confirmed booking validation:`)
      console.log(`   - Hours until meeting: ${hoursUntilMeeting.toFixed(1)}`)
      
      if (hoursUntilMeeting < 24) {
        const errorMsg = hoursUntilMeeting < 0 
          ? "Cannot delete booking after it has started"
          : "Cannot delete confirmed booking less than 24 hours before start time"
        console.error(`❌ [deleteBooking] Deletion validation failed: ${errorMsg}`)
        throw new Error(errorMsg)
      }
      
      console.log(`✅ [deleteBooking] Confirmed booking validation passed - more than 24 hours before start time`)
    } else {
      console.log(`✅ [deleteBooking] Booking is ${booking.status}, can be deleted without time restriction`)
    }
    
    // Delete the booking
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
      
    if (error) {
      console.error(`Error deleting booking ${id}:`, error)
      return false
    }
    
    console.log(`✅ [deleteBooking] Successfully deleted booking ${id}`)
    return true
  } catch (error) {
    console.error('Exception in deleteBooking:', error)
    throw error // Rethrow to allow API to handle the error message
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bookingData = await request.json()
    
    console.log(`🚀 [API] PUT /api/bookings/${id} - Starting booking update`)
    console.log(`📝 [API] Update data:`, bookingData)
    
    const updatedBooking = await updateBooking(id, bookingData)
    
    console.log(`✅ [API] Successfully updated booking ${id}`)
    console.log(`📋 [API] Updated booking result:`, updatedBooking)
    
    return NextResponse.json(updatedBooking)
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error updating booking ${id}:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to update booking" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log(`🗑️ [API] DELETE /api/bookings/${id} - Starting booking deletion`)
    
    try {
      const result = await deleteBooking(id)
      
      if (!result) {
        throw new Error("Failed to delete booking")
      }
      
      console.log(`✅ [API] Successfully deleted booking ${id}`)
      
      return NextResponse.json({ success: true, message: "Booking deleted successfully" })
    } catch (deleteError: any) {
      // Check if this is a validation error (24-hour rule)
      if (deleteError.message && (
        deleteError.message.includes("Cannot delete confirmed booking") || 
        deleteError.message.includes("Cannot delete booking after it has started")
      )) {
        console.error(`⚠️ [API] Validation error deleting booking ${id}:`, deleteError.message)
        return NextResponse.json(
          { error: deleteError.message },
          { status: 400 } // Use 400 Bad Request for validation errors
        )
      }
      
      // Re-throw for other errors
      throw deleteError
    }
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error deleting booking ${id}:`, error)
    return NextResponse.json(
      { error: error.message || "Failed to delete booking" },
      { status: 500 }
    )
  }
}