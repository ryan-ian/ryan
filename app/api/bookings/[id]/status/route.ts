import { type NextRequest, NextResponse } from "next/server"
import { updateBooking, getUserById, getRoomById, getMeetingInvitations } from "@/lib/supabase-data"

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

    // Send email notification via edge function
    try {
      console.log(`📧 [EDGE FUNCTIONS] Attempting to send email notification for booking ${id}`)

      // Get user details
      const user = await getUserById(updatedBooking.user_id)
      if (!user || !user.email || !user.name) {
        console.warn(`⚠️ [EDGE FUNCTIONS] Could not send email - user not found or missing email/name: ${updatedBooking.user_id}`)
      } else {
        console.log(`📧 [EDGE FUNCTIONS] Sending ${status} email to ${user.email}`)

        if (status === "confirmed") {
          // Send booking confirmation email via edge function
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-booking-confirmation`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: id,
              send_ics: true
            })
          })

          const result = await response.json()
          if (response.ok && result.success) {
            console.log(`✅ [EDGE FUNCTIONS] Booking confirmation email sent successfully to ${user.email}`)
          } else {
            console.error(`❌ [EDGE FUNCTIONS] Failed to send confirmation email:`, result.error)
          }
          
        } else if (status === "cancelled") {
          // Send booking rejection email via edge function
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-booking-rejection`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: id,
              rejection_reason: rejection_reason || "No specific reason provided"
            })
          })

          const result = await response.json()
          if (response.ok && result.success) {
            console.log(`✅ [EDGE FUNCTIONS] Booking rejection email sent successfully to ${user.email}`)
          } else {
            console.error(`❌ [EDGE FUNCTIONS] Failed to send rejection email:`, result.error)
          }
        }
      }
    } catch (emailError) {
      console.error(`❌ [EDGE FUNCTIONS] Error sending email notification:`, emailError)
      // Don't fail the entire request if email fails
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