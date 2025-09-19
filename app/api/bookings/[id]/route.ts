import { type NextRequest, NextResponse } from "next/server"
import { updateBooking, getUserById, getRoomById, getMeetingInvitations } from "@/lib/supabase-data"
import { supabase } from "@/lib/supabase"
import { 
  sendBookingModificationConfirmationToUser, 
  sendBookingModificationNotificationToManager, 
  sendBookingConfirmationEmailWithICS,
  sendMeetingInvitationEmailWithICS,
  ensureEmailReady 
} from "@/lib/email-service"
import { generateBookingUpdateICS } from "@/lib/ics-generator"
import { getRoomTimezone, getDefaultReminderMinutes } from "@/lib/timezone-utils"

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

    // Get the original booking to compare changes
    const { data: originalBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !originalBooking) {
      console.error(`❌ [API] Error fetching original booking ${id}:`, fetchError)
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      )
    }

    // Update the booking
    const updatedBooking = await updateBooking(id, bookingData)

    console.log(`✅ [API] Successfully updated booking ${id}`)
    console.log(`📋 [API] Updated booking result:`, updatedBooking)

    // Fetch the complete updated booking with related data for email notifications
    const { data: completeUpdatedBooking, error: fetchCompleteError } = await supabase
      .from('bookings')
      .select('*, users:user_id(id, name, email), rooms:room_id(id, name, facility_id)')
      .eq('id', id)
      .single()

    if (fetchCompleteError) {
      console.error(`⚠️ [API] Error fetching complete booking data for email notifications:`, fetchCompleteError)
    } else {
      // Send email notifications after successful update
      try {
        await sendBookingUpdateEmailNotifications(originalBooking, completeUpdatedBooking, bookingData)
      } catch (emailError) {
        console.error(`⚠️ [API] Failed to send email notifications for booking ${id}:`, emailError)
        // Don't fail the update if email fails
      }
    }

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

// Helper function to send email notifications for booking updates
async function sendBookingUpdateEmailNotifications(
  originalBooking: any,
  updatedBooking: any,
  updateData: any
) {
  try {
    // Ensure email service is ready
    console.log(`🔍 [EMAIL DEBUG] Ensuring email service is ready...`)
    const emailReady = await ensureEmailReady()
    if (!emailReady) {
      console.error('❌ [EMAIL DEBUG] Email service not ready, cannot send modification emails')
      return
    }
    console.log(`✅ [EMAIL DEBUG] Email service is ready`)
    console.log(`🔍 [EMAIL DEBUG] Updated booking structure:`, updatedBooking)

    // Extract user information from the joined data
    let user = updatedBooking.users
    if (Array.isArray(user)) {
      user = user[0] // Take first element if it's an array
    }

    console.log(`🔍 [EMAIL DEBUG] Extracted user:`, user)

    if (!user || !user.id) {
      console.warn(`⚠️ User not found in booking data for booking ${updatedBooking.id}`)
      return
    }

    // Extract room information from the joined data
    let room = updatedBooking.rooms
    if (Array.isArray(room)) {
      room = room[0] // Take first element if it's an array
    }

    console.log(`🔍 [EMAIL DEBUG] Extracted room:`, room)

    if (!room || !room.id) {
      console.warn(`⚠️ Room not found in booking data for booking ${updatedBooking.id}`)
      return
    }

    // Get facility with manager information
    console.log(`🔍 [EMAIL DEBUG] Fetching facility for room ${room.id}, facility_id: ${room.facility_id}`)
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*, manager:manager_id(id, name, email)')
      .eq('id', room.facility_id)
      .single()

    console.log(`🔍 [EMAIL DEBUG] Facility query result:`, { facility, facilityError })

    if (facilityError || !facility) {
      console.warn(`⚠️ Facility not found for room ${room.id}`, facilityError)
      return
    }

    console.log(`🔍 [EMAIL DEBUG] Facility manager data:`, facility.manager)

    // Handle potential array structure for manager data
    let manager = facility.manager
    if (Array.isArray(manager)) {
      manager = manager[0] // Take first element if it's an array
    }

    console.log(`🔍 [EMAIL DEBUG] Extracted manager:`, manager)

    // Determine what changes were made
    const changes: string[] = []

    if (updateData.title && updateData.title !== originalBooking.title) {
      changes.push(`Title changed from "${originalBooking.title}" to "${updateData.title}"`)
    }

    if (updateData.description !== undefined && updateData.description !== originalBooking.description) {
      const oldDesc = originalBooking.description || 'No description'
      const newDesc = updateData.description || 'No description'
      changes.push(`Description changed from "${oldDesc}" to "${newDesc}"`)
    }

    if (updateData.start_time && updateData.start_time !== originalBooking.start_time) {
      const oldTime = new Date(originalBooking.start_time).toLocaleString()
      const newTime = new Date(updateData.start_time).toLocaleString()
      changes.push(`Start time changed from ${oldTime} to ${newTime}`)
    }

    if (updateData.end_time && updateData.end_time !== originalBooking.end_time) {
      const oldTime = new Date(originalBooking.end_time).toLocaleString()
      const newTime = new Date(updateData.end_time).toLocaleString()
      changes.push(`End time changed from ${oldTime} to ${newTime}`)
    }

    // Send confirmation email to user
    console.log(`🔍 [EMAIL DEBUG] User email check: ${user.email}`)
    if (user.email) {
      try {
        console.log(`📧 [EMAIL DEBUG] Attempting to send user confirmation email to ${user.email}`)
        const userEmailResult = await sendBookingModificationConfirmationToUser(
          user.email,
          user.name,
          updatedBooking.title,
          room.name,
          facility.name,
          updatedBooking.start_time,
          updatedBooking.end_time,
          changes
        )
        console.log(`📧 [EMAIL DEBUG] User email result: ${userEmailResult}`)
        console.log(`📧 Modification confirmation email sent to user ${user.name} (${user.email})`)
      } catch (emailError) {
        console.error("❌ [EMAIL DEBUG] Failed to send user confirmation email:", emailError)
      }
    } else {
      console.warn(`⚠️ [EMAIL DEBUG] No email address found for user ${user.name}`)
    }

    // Send notification email to facility manager
    console.log(`🔍 [EMAIL DEBUG] Facility manager check:`, {
      hasManager: !!manager,
      managerEmail: manager?.email,
      managerName: manager?.name
    })

    if (manager && manager.email) {
      try {
        console.log(`📧 [EMAIL DEBUG] Attempting to send facility manager notification email to ${manager.email}`)
        const managerEmailResult = await sendBookingModificationNotificationToManager(
          manager.email,
          manager.name,
          user.name,
          user.email,
          updatedBooking.title,
          room.name,
          facility.name,
          updatedBooking.start_time,
          updatedBooking.end_time,
          changes
        )
        console.log(`📧 [EMAIL DEBUG] Manager email result: ${managerEmailResult}`)
        console.log(`📧 Modification notification email sent to facility manager ${manager.name} (${manager.email})`)
      } catch (emailError) {
        console.error("❌ [EMAIL DEBUG] Failed to send facility manager notification email:", emailError)
      }
    } else {
      console.warn(`⚠️ [EMAIL DEBUG] No facility manager email found for facility ${facility.name}`)
      console.warn(`⚠️ [EMAIL DEBUG] Facility manager object:`, manager)
    }

    // Send ICS updates if this is a confirmed booking and has significant changes
    if (updatedBooking.status === 'confirmed' && changes.length > 0) {
      console.log(`📧 [EMAIL DEBUG] Sending ICS updates for confirmed booking with ${changes.length} changes`)
      
      try {
        // Determine timezone and reminder settings
        const timezone = getRoomTimezone(room, facility)
        const reminderMinutes = getDefaultReminderMinutes(timezone)
        
        console.log(`📅 [EMAIL DEBUG] Using timezone ${timezone} with ${reminderMinutes}-minute reminder for update`)
        
        // We need to determine the sequence number - for now using a simple increment
        // In a production system, you'd store this in the database
        const sequence = 1 // This should be incremented based on previous updates
        
        // Generate updated ICS for organizer
        const organizerIcsContent = generateBookingUpdateICS(
          updatedBooking.id,
          updatedBooking.title,
          updatedBooking.description,
          room.name,
          facility.name,
          updatedBooking.start_time,
          updatedBooking.end_time,
          user.email,
          user.name,
          [], // No attendees for organizer's copy
          sequence,
          reminderMinutes,
          timezone
        )
        
        // Send updated confirmation to organizer
        if (user.email) {
          await sendBookingConfirmationEmailWithICS(
            user.email,
            user.name,
            updatedBooking.title,
            room.name,
            facility.name,
            updatedBooking.start_time,
            updatedBooking.end_time,
            updatedBooking.description,
            organizerIcsContent
          )
          console.log(`✅ [EMAIL DEBUG] Updated ICS sent to organizer ${user.email}`)
        }
        
        // Send updates to attendees if any exist
        const invitations = await getMeetingInvitations(updatedBooking.id)
        console.log(`📧 [EMAIL DEBUG] Found ${invitations.length} meeting invitations for updated booking`)
        
        if (invitations.length > 0) {
          // Generate ICS with attendees for invitees
          const attendees = invitations.map(inv => ({
            email: inv.invitee_email,
            name: inv.invitee_name || undefined
          }))
          
          const inviteeIcsContent = generateBookingUpdateICS(
            updatedBooking.id,
            updatedBooking.title,
            updatedBooking.description,
            room.name,
            facility.name,
            updatedBooking.start_time,
            updatedBooking.end_time,
            user.email,
            user.name,
            attendees,
            sequence,
            reminderMinutes,
            timezone
          )
          
          // Send updated invitations to all invitees
          const updatePromises = invitations.map(async (invitation) => {
            try {
              await sendMeetingInvitationEmailWithICS(
                invitation.invitee_email,
                invitation.invitee_name || "",
                user.name,
                user.email,
                updatedBooking.title,
                room.name,
                facility.name,
                updatedBooking.start_time,
                updatedBooking.end_time,
                updatedBooking.description,
                inviteeIcsContent
              )
              console.log(`✅ [EMAIL DEBUG] Updated invitation with ICS sent to ${invitation.invitee_email}`)
            } catch (emailError) {
              console.error(`❌ [EMAIL DEBUG] Failed to send updated invitation to ${invitation.invitee_email}:`, emailError)
            }
          })
          
          await Promise.allSettled(updatePromises)
          console.log(`✅ [EMAIL DEBUG] All meeting update notifications processed`)
        }
        
      } catch (icsError) {
        console.error(`❌ [EMAIL DEBUG] Failed to send ICS updates:`, icsError)
        // Don't fail the update if ICS sending fails
      }
    }

  } catch (error) {
    console.error("Error in sendBookingUpdateEmailNotifications:", error)
    throw error
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