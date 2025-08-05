import { type NextRequest, NextResponse } from "next/server"
import { updateBooking, getUserById, getRoomById } from "@/lib/supabase-data"
import { sendBookingConfirmationEmail, sendBookingRejectionEmail } from "@/lib/email-service"

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

    // Send email notification to the user who created the booking
    try {
      console.log(`📧 [API] Attempting to send email notification for booking ${id}`)

      // Get user details
      const user = await getUserById(updatedBooking.user_id)
      if (!user || !user.email || !user.name) {
        console.warn(`⚠️ [API] Could not send email - user not found or missing email/name: ${updatedBooking.user_id}`)
      } else {
        // Get room details
        const room = await getRoomById(updatedBooking.room_id)
        if (!room) {
          console.warn(`⚠️ [API] Could not send email - room not found: ${updatedBooking.room_id}`)
        } else {
          console.log(`📧 [API] Sending ${status} email to ${user.email}`)

          if (status === "confirmed") {
            // Send booking confirmation email
            await sendBookingConfirmationEmail(
              user.email,
              user.name,
              updatedBooking.title,
              room.name,
              updatedBooking.start_time,
              updatedBooking.end_time
            )
            console.log(`✅ [API] Booking confirmation email sent successfully to ${user.email}`)
          } else if (status === "cancelled") {
            // Send booking rejection email
            const rejectionReasonText = rejection_reason || "No specific reason provided"
            await sendBookingRejectionEmail(
              user.email,
              user.name,
              updatedBooking.title,
              room.name,
              rejectionReasonText,
              updatedBooking.start_time,
              updatedBooking.end_time
            )
            console.log(`✅ [API] Booking rejection email sent successfully to ${user.email}`)
          }
        }
      }
    } catch (emailError) {
      console.error(`❌ [API] Failed to send email notification for booking ${id}:`, emailError)
      // Don't fail the booking status update if email fails
    }

    console.log(`🔍 [API] updateBooking function completed, checking if email logs appeared above...`)

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `Booking ${status === "confirmed" ? "approved" : "rejected"} successfully`
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error updating booking ${id} status:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update booking status" 
      },
      { status: 500 }
    )
  }
}