import { NextRequest, NextResponse } from 'next/server'
import { supabase, createAdminClient } from '@/lib/supabase'
import { 
  isValidAttendanceCodeFormat,
  extractIPAddress,
  sanitizeUserAgent,
  createAttendanceEventData 
} from '@/lib/attendance-utils'
import * as types from '@/types'

/**
 * Verify attendance code and mark attendance
 * POST /api/meetings/[bookingId]/attendance/verify
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { invitation_id, code } = body as types.AttendanceVerificationRequest

    if (!invitation_id || !code) {
      return NextResponse.json(
        { error: 'Invitation ID and code are required' },
        { status: 400 }
      )
    }

    // Validate code format
    if (!isValidAttendanceCodeFormat(code)) {
      return NextResponse.json(
        { error: 'Invalid code format. Code must be 4 digits' },
        { status: 400 }
      )
    }

    // Get IP and User Agent for audit logging
    const ipAddress = extractIPAddress(Object.fromEntries(request.headers.entries()))
    const userAgent = sanitizeUserAgent(request.headers.get('user-agent') || undefined)

    // Use admin client to bypass RLS and call verification function
    const adminClient = createAdminClient()

    // Call the database function to verify attendance code
    const { data: verificationResult, error: verificationError } = await adminClient
      .rpc('verify_attendance_code', {
        invitation_id: invitation_id,
        submitted_code: code
      })

    if (verificationError) {
      console.error('Error verifying attendance code:', verificationError)
      return NextResponse.json(
        { error: 'Failed to verify attendance code' },
        { status: 500 }
      )
    }

    // The function returns a JSONB object with success/error info
    const result = verificationResult as { success: boolean; error?: string; attended_at?: string }

    if (!result.success) {
      // Log failed verification attempt (this is handled in the DB function too, but we can add client-side logging)
      try {
        const eventData = createAttendanceEventData(
          'verify_failed',
          bookingId,
          invitation_id,
          { error: result.error, submitted_code_length: code.length },
          ipAddress,
          userAgent
        )

        // Note: This might be redundant with DB function logging, but provides additional context
        await adminClient
          .from('meeting_attendance_events')
          .insert(eventData)
      } catch (eventError) {
        console.error('Failed to log verification failure:', eventError)
      }

      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Verification failed' 
        } as types.AttendanceVerificationResponse,
        { status: 400 }
      )
    }

    // Success! Get updated occupancy data
    const { data: occupancyData, error: occupancyError } = await adminClient
      .rpc('get_meeting_occupancy', { booking_id_param: bookingId })

    const occupancy = {
      present: occupancyData?.present || 0,
      accepted: occupancyData?.accepted || 0,
      capacity: occupancyData?.capacity || 0
    }

    // Additional success logging with client context
    try {
      const eventData = createAttendanceEventData(
        'verify_success',
        bookingId,
        invitation_id,
        { 
          attended_at: result.attended_at,
          new_occupancy: occupancy
        },
        ipAddress,
        userAgent
      )

      await adminClient
        .from('meeting_attendance_events')
        .insert(eventData)
    } catch (eventError) {
      console.error('Failed to log verification success:', eventError)
      // Don't fail the request if logging fails
    }

    const response: types.AttendanceVerificationResponse = {
      success: true,
      attended_at: result.attended_at,
      occupancy
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Exception in verify attendance code:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      } as types.AttendanceVerificationResponse,
      { status: 500 }
    )
  }
}
