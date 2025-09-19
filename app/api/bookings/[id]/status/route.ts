import { type NextRequest, NextResponse } from "next/server"
import { updateBooking, getUserById, getRoomById, getMeetingInvitations } from "@/lib/supabase-data"
import { 
  sendBookingConfirmationEmail, 
  sendBookingRejectionEmail,
  sendBookingConfirmationEmailWithICS,
  sendMeetingInvitationEmailWithICS,
  sendBookingCancellationEmailWithICS
} from "@/lib/email-service"
import { 
  generateBookingApprovalICS, 
  generateBookingCancellationICS 
} from "@/lib/ics-generator"
import { getRoomTimezone, getDefaultReminderMinutes } from "@/lib/timezone-utils"

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
            // Get facility name for location
            const facilityName = room.location || "Conference Hub"
            
            // Determine timezone and reminder settings
            const timezone = getRoomTimezone(room, { name: facilityName, location: room.location })
            const reminderMinutes = getDefaultReminderMinutes(timezone)
            
            console.log(`📅 [API] Using timezone ${timezone} with ${reminderMinutes}-minute reminder for booking ${id}`)
            
            // Generate ICS for the booking approval
            const icsContent = generateBookingApprovalICS(
              id,
              updatedBooking.title,
              updatedBooking.description,
              room.name,
              facilityName,
              updatedBooking.start_time,
              updatedBooking.end_time,
              user.email,
              user.name,
              [], // No attendees for organizer's copy
              reminderMinutes,
              timezone
            )
            
            // Send booking confirmation email with ICS
            await sendBookingConfirmationEmailWithICS(
              user.email,
              user.name,
              updatedBooking.title,
              room.name,
              facilityName,
              updatedBooking.start_time,
              updatedBooking.end_time,
              updatedBooking.description,
              icsContent
            )
            console.log(`✅ [API] Booking confirmation email with ICS sent successfully to ${user.email}`)
            console.log(`📋 [API] Booking approved - organizer can now invite attendees through the system`)
            
          } else if (status === "cancelled") {
            // Get facility name for location
            const facilityName = room.location || "Conference Hub"
            
            // Determine timezone (same as approval)
            const timezone = getRoomTimezone(room, { name: facilityName, location: room.location })
            
            console.log(`📅 [API] Using timezone ${timezone} for cancellation of booking ${id}`)
            
            // Generate cancellation ICS
            const cancellationIcsContent = generateBookingCancellationICS(
              id,
              updatedBooking.title,
              updatedBooking.description,
              room.name,
              facilityName,
              updatedBooking.start_time,
              updatedBooking.end_time,
              user.email,
              user.name,
              [], // No attendees for organizer's copy initially
              0, // Sequence 0 for now (should be incremented in real implementation)
              timezone
            )
            
            // Send booking cancellation email with ICS
            const rejectionReasonText = rejection_reason || "No specific reason provided"
            await sendBookingCancellationEmailWithICS(
              user.email,
              user.name,
              updatedBooking.title,
              room.name,
              facilityName,
              updatedBooking.start_time,
              updatedBooking.end_time,
              rejectionReasonText,
              cancellationIcsContent
            )
            console.log(`✅ [API] Booking cancellation email with ICS sent successfully to ${user.email}`)
            
            // Send cancellation notices to attendees if any exist
            try {
              const invitations = await getMeetingInvitations(id)
              console.log(`📧 [API] Found ${invitations.length} meeting invitations for cancelled booking ${id}`)
              
              if (invitations.length > 0) {
                // Generate cancellation ICS with attendees for invitees
                const attendees = invitations.map(inv => ({
                  email: inv.invitee_email,
                  name: inv.invitee_name || undefined
                }))
                
                const inviteeCancellationIcs = generateBookingCancellationICS(
                  id,
                  updatedBooking.title,
                  updatedBooking.description,
                  room.name,
                  facilityName,
                  updatedBooking.start_time,
                  updatedBooking.end_time,
                  user.email,
                  user.name,
                  attendees,
                  0, // Sequence 0 for now
                  timezone
                )
                
                // Send cancellation notices to all invitees
                const cancellationPromises = invitations.map(async (invitation) => {
                  try {
                    await sendBookingCancellationEmailWithICS(
                      invitation.invitee_email,
                      invitation.invitee_name || "Attendee",
                      updatedBooking.title,
                      room.name,
                      facilityName,
                      updatedBooking.start_time,
                      updatedBooking.end_time,
                      `Meeting cancelled by organizer: ${rejectionReasonText}`,
                      inviteeCancellationIcs
                    )
                    console.log(`✅ [API] Meeting cancellation notice with ICS sent to ${invitation.invitee_email}`)
                  } catch (emailError) {
                    console.error(`❌ [API] Failed to send cancellation email to ${invitation.invitee_email}:`, emailError)
                  }
                })
                
                await Promise.allSettled(cancellationPromises)
                console.log(`✅ [API] All meeting cancellation emails processed for booking ${id}`)
              }
            } catch (invitationError) {
              console.error(`❌ [API] Failed to process meeting cancellations for booking ${id}:`, invitationError)
              // Don't fail the cancellation if invitations fail
            }
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