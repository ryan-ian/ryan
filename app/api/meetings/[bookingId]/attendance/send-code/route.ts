import { NextRequest, NextResponse } from 'next/server'
import { supabase, createAdminClient } from '@/lib/supabase'
import { 
  canRequestAttendanceCode, 
  isAttendanceWindowOpen,
  extractIPAddress,
  sanitizeUserAgent,
  createAttendanceEventData 
} from '@/lib/attendance-utils'
import * as types from '@/types'

/**
 * Send attendance code to invitee
 * POST /api/meetings/[bookingId]/attendance/send-code
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { invitation_id } = body as types.AttendanceCodeRequest

    if (!invitation_id) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      )
    }

    // Get IP and User Agent for audit logging
    const ipAddress = extractIPAddress(Object.fromEntries(request.headers.entries()))
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent') || undefined)

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()

    // Get invitation details with booking info
    const { data: invitation, error: invitationError } = await adminClient
      .from('meeting_invitations')
      .select(`
        *,
        bookings:booking_id(
          id,
          title,
          start_time,
          end_time,
          status,
          rooms:room_id(name, location)
        )
      `)
      .eq('id', invitation_id)
      .eq('booking_id', bookingId)
      .single()

    if (invitationError || !invitation) {
      console.error('Invitation not found:', invitationError)
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      )
    }

    const booking = invitation.bookings as any

    // Validate booking status
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Meeting booking is not confirmed' },
        { status: 400 }
      )
    }

    // Check if already attended
    if (invitation.attendance_status === 'present') {
      return NextResponse.json(
        { error: 'Attendance already marked' },
        { status: 400 }
      )
    }

    // Check attendance window
    if (!isAttendanceWindowOpen(booking.start_time, booking.end_time)) {
      return NextResponse.json(
        { error: 'Attendance marking is not available at this time' },
        { status: 400 }
      )
    }

    // Check rate limiting
    const canRequest = canRequestAttendanceCode(
      invitation.attendance_code_last_sent_at,
      invitation.attendance_code_send_count || 0
    )

    if (!canRequest.canRequest) {
      return NextResponse.json(
        { error: canRequest.reason },
        { status: 429 }
      )
    }

    // Generate new attendance code if needed, or get existing one
    // Note: The Edge Function will handle code generation and email sending
    // We just need to validate the request and call the Edge Function

    // Send email with attendance code via Edge Function
    try {
      const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-attendance-code`
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          invitation_id: invitation_id,
          booking_id: bookingId,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        console.error('Edge function failed:', result)
        return NextResponse.json(
          { error: 'Failed to send attendance code email' },
          { status: 500 }
        )
      }

      console.log('✅ Attendance code sent via Edge Function:', result.messageId)
    } catch (emailError) {
      console.error('Exception calling Edge Function:', emailError)
      return NextResponse.json(
        { error: 'Failed to send attendance code email' },
        { status: 500 }
      )
    }

    // Log the code sent event
    try {
      const eventData = createAttendanceEventData(
        'code_sent',
        bookingId,
        invitation_id,
        { 
          send_count: (invitation.attendance_code_send_count || 0) + 1,
          email: invitation.invitee_email 
        },
        ipAddress,
        userAgent
      )

      await adminClient
        .from('meeting_attendance_events')
        .insert(eventData)
    } catch (eventError) {
      console.error('Failed to log code sent event:', eventError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance code sent to your email',
      sent_at: new Date().toISOString(),
      send_count: (invitation.attendance_code_send_count || 0) + 1
    })

  } catch (error) {
    console.error('Exception in send attendance code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
