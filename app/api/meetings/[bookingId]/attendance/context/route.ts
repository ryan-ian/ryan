import { NextRequest, NextResponse } from 'next/server'
import { supabase, createAdminClient } from '@/lib/supabase'
import { shouldShowQR } from '@/lib/attendance-utils'
import * as types from '@/types'

/**
 * Get meeting attendance context
 * Returns meeting info, occupancy, and QR visibility
 * GET /api/meetings/[bookingId]/attendance/context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    // Use admin client to get full meeting context
    const adminClient = createAdminClient()

    // Get meeting details with room info
    const { data: booking, error: bookingError } = await adminClient
      .from('bookings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        checked_in_at,
        rooms:room_id(
          id,
          name,
          location,
          capacity
        )
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError)
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      )
    }

    // Check if meeting is confirmed
    if (booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Meeting is not confirmed' },
        { status: 400 }
      )
    }

    // Get occupancy data using the database function
    const { data: occupancyData, error: occupancyError } = await adminClient
      .rpc('get_meeting_occupancy', { booking_id_param: bookingId })

    if (occupancyError) {
      console.error('Error getting occupancy:', occupancyError)
      return NextResponse.json(
        { error: 'Failed to get occupancy data' },
        { status: 500 }
      )
    }

    const occupancy = {
      present: occupancyData?.present || 0,
      invited: occupancyData?.invited || 0,
      capacity: occupancyData?.capacity || (booking.rooms as any)?.capacity || 0
    }

    // Determine if QR should be shown (after meeting start AND organizer check-in)
    const showQr = shouldShowQR(booking.start_time, booking.end_time, booking.checked_in_at)

    // Build response
    const context: types.AttendanceContext = {
      meeting: {
        id: booking.id,
        title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        room_name: (booking.rooms as any)?.name || 'Unknown Room',
        room_capacity: (booking.rooms as any)?.capacity || 0
      },
      occupancy,
      showQr
    }

    return NextResponse.json(context)

  } catch (error) {
    console.error('Exception in attendance context:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
