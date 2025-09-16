import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import {
  getMeetingInvitations,
  createMeetingInvitations,
  createMeetingInvitationsWithNames,
  checkInvitationCapacity,
  checkInvitationCapacityForAttendees
} from "@/lib/meeting-invitations"
import {
  getRoomById,
  getBookingById,
  getUserById
} from "@/lib/supabase-data"
import { sendMeetingInvitationEmail } from "@/lib/email-service"

// GET - Fetch meeting invitations for a booking
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const bookingId = searchParams.get("bookingId")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Verify user has access to this booking
    const booking = await getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user owns the booking or is admin
    if (booking.user_id !== user.id && user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const invitations = await getMeetingInvitations(bookingId)
    return NextResponse.json(invitations)

  } catch (error) {
    console.error("Error fetching meeting invitations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST - Create meeting invitations
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { bookingId, inviteeEmails, attendees } = await request.json()

    // Support both old format (inviteeEmails) and new format (attendees)
    let finalAttendees: Array<{ name?: string, email: string }> = []
    
    if (attendees && Array.isArray(attendees)) {
      // New format with names and emails
      finalAttendees = attendees.filter((a: any) => a.email && typeof a.email === 'string')
    } else if (inviteeEmails && Array.isArray(inviteeEmails)) {
      // Legacy format with just emails
      finalAttendees = inviteeEmails.map((email: string) => ({ email }))
    }

    if (!bookingId || finalAttendees.length === 0) {
      return NextResponse.json({ 
        error: "Booking ID and attendees are required" 
      }, { status: 400 })
    }

    // Verify booking exists and user has access
    const booking = await getBookingById(bookingId)
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Check if user owns the booking or is admin
    if (booking.user_id !== user.id && user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Check if booking is confirmed (only confirmed bookings can have invitations)
    if (booking.status !== 'confirmed') {
      return NextResponse.json({ 
        error: "Only confirmed bookings can have meeting invitations" 
      }, { status: 400 })
    }

    // Check capacity
    const capacityCheck = await checkInvitationCapacityForAttendees(bookingId, finalAttendees)
    if (!capacityCheck.canInvite) {
      return NextResponse.json({ 
        error: capacityCheck.message || "Room capacity exceeded" 
      }, { status: 400 })
    }

    // Create invitations with the enhanced function
    const invitations = await createMeetingInvitationsWithNames(bookingId, user.id, finalAttendees)

    // Get additional data for email
    const room = await getRoomById(booking.room_id)
    const organizer = await getUserById(user.id)

    if (!room || !organizer) {
      return NextResponse.json({ 
        error: "Failed to get room or organizer information" 
      }, { status: 500 })
    }

    // Send invitation emails
    const emailPromises = invitations.map(async (invitation) => {
      try {
        await sendMeetingInvitationEmail(
          invitation.invitee_email,
          invitation.invitee_name || "", // Pass the invitee name
          organizer.name,
          organizer.email,
          booking.title,
          room.name,
          room.location || "Conference Room", // Use location as facility name fallback
          booking.start_time,
          booking.end_time,
          booking.description
        )
        console.log(`✅ Invitation email sent to ${invitation.invitee_email}${invitation.invitee_name ? ` (${invitation.invitee_name})` : ''}`)
      } catch (emailError) {
        console.error(`❌ Failed to send invitation email to ${invitation.invitee_email}:`, emailError)
        // Don't fail the entire request if email fails
      }
    })

    // Wait for all emails to be sent (or fail)
    await Promise.allSettled(emailPromises)

    return NextResponse.json(invitations, { status: 201 })

  } catch (error) {
    console.error("Error creating meeting invitations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
