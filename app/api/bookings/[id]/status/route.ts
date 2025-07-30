import { type NextRequest, NextResponse } from "next/server"
import { updateBooking } from "@/lib/supabase-data"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { status, rejection_reason } = await request.json()
    
    console.log(`🚀 [API] POST /api/bookings/${id}/status - Starting booking status update`)
    console.log(`📝 [API] Status: ${status}, Rejection reason: ${rejection_reason || 'N/A'}`)
    
    const updateData: any = { status }
    if (status === "cancelled" && rejection_reason) {
      updateData.rejection_reason = rejection_reason
    }
    
    console.log(`🔄 [API] About to call updateBooking with data:`, updateData)
    console.log(`🔄 [API] Calling updateBooking(${id}, ${JSON.stringify(updateData)})`)
    
    const updatedBooking = await updateBooking(id, updateData)
    
    console.log(`✅ [API] Successfully updated booking ${id} status to ${status}`)
    console.log(`📋 [API] Updated booking result:`, updatedBooking)
    console.log(`🔍 [API] updateBooking function completed, checking if email logs appeared above...`)
    
    return NextResponse.json({ 
      success: true, 
      booking: updatedBooking,
      message: `Booking ${status === "confirmed" ? "approved" : "rejected"} successfully`
    })
  } catch (error: any) {
    console.error(`❌ [API] Error updating booking ${params.id} status:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update booking status" 
      },
      { status: 500 }
    )
  }
}