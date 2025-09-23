import { NextRequest, NextResponse } from 'next/server'
import { supabase, createAdminClient } from '@/lib/supabase'
import { verifyQRToken } from '@/lib/attendance-utils'
import * as types from '@/types'

/**
 * Get attendee list for QR attendance
 * Returns only accepted invitees with their attendance status
 * GET /api/meetings/[bookingId]/attendance/attendees?t=<qr_token>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('t')

    if (!token) {
      return NextResponse.json(
        { error: 'QR token is required' },
        { status: 401 }
      )
    }

    // Verify QR token
    const tokenPayload = verifyQRToken(token)
    if (!tokenPayload || tokenPayload.booking_id !== bookingId) {
      return NextResponse.json(
        { error: 'Invalid or expired QR token' },
        { status: 401 }
      )
    }

    // Use admin client to get attendee list
    const adminClient = createAdminClient()

    // Get all invitations for this booking (no RSVP filtering)
    const { data: invitations, error: invitationsError } = await adminClient
      .from('meeting_invitations')
      .select('id, invitee_name, invitee_email, attendance_status')
      .eq('booking_id', bookingId)
      .order('invitee_name', { ascending: true })

    type InvitationRow = {
      id: string
      invitee_name: string | null
      invitee_email: string
      attendance_status: 'not_present' | 'present' | null
    }

    if (invitationsError) {
      console.error('Error fetching invitations:', invitationsError)
      return NextResponse.json(
        { error: 'Failed to fetch attendee list' },
        { status: 500 }
      )
    }

    // Format attendee list (don't expose emails for security)
    const attendees: types.AttendeeListItem[] = (invitations as InvitationRow[] || []).map(invitation => ({
      invitation_id: invitation.id,
      display_name: invitation.invitee_name || invitation.invitee_email.split('@')[0],
      attendance_status: invitation.attendance_status || 'not_present'
    }))

    return NextResponse.json({
      attendees,
      total_invited: attendees.length,
      present_count: attendees.filter(a => a.attendance_status === 'present').length
    })

  } catch (error) {
    console.error('Exception in attendees list:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
