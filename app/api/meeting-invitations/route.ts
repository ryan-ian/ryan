import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createClient } from '@supabase/supabase-js'
import {
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
import { getRoomTimezone, getDefaultReminderMinutes } from "@/lib/timezone-utils"

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

    // Get user's role from the database (not from user_metadata)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to verify user permissions" }, { status: 500 })
    }

    const userRole = (userData as { role: string })?.role || 'user'

    // Check if user has access to this booking
    // Allow access if:
    // 1. User owns the booking
    // 2. User is admin
    // 3. User is facility manager (will be further validated by RLS policies)
    const hasAccess = booking.user_id === user.id ||
                     userRole === 'admin' ||
                     userRole === 'facility_manager'

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Create a user-specific Supabase client with the user's token
    // This ensures RLS policies are applied correctly for the authenticated user
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Set the user's session on this client
    await userSupabase.auth.setSession({
      access_token: token,
      refresh_token: '', // Not needed for this operation
    })

    // Query meeting invitations with the user-specific client
    // This will apply RLS policies based on the authenticated user
    const { data: invitations, error: invitationsError } = await userSupabase
      .from('meeting_invitations')
      .select('*')
      .eq('booking_id', bookingId)
      .order('invited_at', { ascending: false })

    if (invitationsError) {
      console.error('Error fetching meeting invitations:', invitationsError)
      return NextResponse.json({ error: "Failed to fetch meeting invitations" }, { status: 500 })
    }

    return NextResponse.json(invitations || [])

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

    // Get user's role from the database (not from user_metadata)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError) {
      console.error("Error fetching user role:", userError)
      return NextResponse.json({ error: "Failed to verify user permissions" }, { status: 500 })
    }

    const userRole = (userData as { role: string })?.role || 'user'

    // Check if user has access to this booking
    // Allow access if:
    // 1. User owns the booking
    // 2. User is admin
    // 3. User is facility manager (will be further validated by RLS policies)
    const hasAccess = booking.user_id === user.id ||
                     userRole === 'admin' ||
                     userRole === 'facility_manager'

    if (!hasAccess) {
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

    // Insert invitations into database first
    const insertedInvitations = []
    for (const attendee of finalAttendees) {
      try {
        // Create a user-specific Supabase client with the user's token
        const userSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        await userSupabase.auth.setSession({
          access_token: token,
          refresh_token: '',
        })

        const { data: invitation, error: invError } = await userSupabase
          .from('meeting_invitations')
          .insert({
            booking_id: bookingId,
            organizer_id: user.id,
            invitee_email: attendee.email,
            invitee_name: attendee.name || attendee.email.split('@')[0],
            status: 'pending',
          })
          .select()
          .single()

        if (invError) {
          console.error(`❌ Failed to insert invitation for ${attendee.email}:`, invError)
          continue
        }

        insertedInvitations.push({
          ...invitation,
          invitee_data: {
            name: attendee.name || attendee.email.split('@')[0],
            email: attendee.email
          }
        })

        console.log(`✅ Invitation record created for ${attendee.email}: ${invitation.id}`)

      } catch (error) {
        console.error(`❌ Error inserting invitation for ${attendee.email}:`, error)
      }
    }

    if (insertedInvitations.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any invitations in database' },
        { status: 500 }
      )
    }

    console.log(`✅ Inserted ${insertedInvitations.length} invitations into database`)

    // Now call Edge Function to send emails for the inserted invitations
    const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-meeting-invitations`
    try {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          booking_id: bookingId,
          invitations: insertedInvitations.map(inv => ({
            id: inv.id,
            name: inv.invitee_data.name,
            email: inv.invitee_data.email
          })),
        }),
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        console.error('❌ Edge function failed:', result)
        // Invitations are already in DB, so return them even if email failed
        return NextResponse.json({
          invitations: insertedInvitations,
          email_status: 'failed',
          error: result.error || 'Failed to send invitation emails'
        }, { status: 207 }) // 207 Multi-Status
      }

      console.log(`✅ Emails sent via Edge Function:`, result.summary)
      
      // Return the invitations we inserted
      return NextResponse.json(insertedInvitations, { status: 201 })

    } catch (error) {
      console.error('❌ Error calling Edge Function:', error)
      // Invitations are already in DB, so return them even if email failed
      return NextResponse.json({
        invitations: insertedInvitations,
        email_status: 'failed',
        error: 'Failed to send invitation emails'
      }, { status: 207 }) // 207 Multi-Status
    }

  } catch (error) {
    console.error("Error creating meeting invitations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
