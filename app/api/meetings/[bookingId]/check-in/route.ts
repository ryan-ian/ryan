import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

/**
 * Check-in organizer for meeting (enables QR visibility)
 * POST /api/meetings/[bookingId]/check-in
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params
    const body = await request.json()
    const { user_id } = body

    // Use admin client to update booking
    const adminClient = createAdminClient()

    // Call the existing check-in function
    const { data: result, error } = await adminClient.rpc('handle_booking_check_in', {
      booking_id_param: bookingId,
      user_id_param: user_id || null
    })

    if (error) {
      console.error('Check-in error:', error)
      return NextResponse.json(
        { success: false, error: error.message || 'Check-in failed' },
        { status: 500 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      checked_in_at: result.checked_in_at,
      message: 'Successfully checked in to meeting'
    })

  } catch (error) {
    console.error('Exception in meeting check-in:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get meeting check-in status
 * GET /api/meetings/[bookingId]/check-in
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params

    // Use admin client to get booking details
    const adminClient = createAdminClient()
    
    const { data: booking, error } = await adminClient
      .from('bookings')
      .select('id, checked_in_at, check_in_required, start_time, status')
      .eq('id', bookingId)
      .single()

    if (error || !booking) {
      return NextResponse.json(
        { success: false, error: 'Meeting not found' },
        { status: 404 }
      )
    }

    const now = new Date()
    const startTime = new Date(booking.start_time)
    const checkInAvailableAt = new Date(startTime.getTime() - 15 * 60 * 1000) // 15 minutes before

    const checkInStatus = {
      isCheckedIn: !!booking.checked_in_at,
      checkInTime: booking.checked_in_at,
      checkInRequired: booking.check_in_required ?? true,
      canCheckIn: now >= checkInAvailableAt && 
                  !booking.checked_in_at && 
                  booking.status === 'confirmed',
      checkInAvailableAt: checkInAvailableAt.toISOString()
    }

    return NextResponse.json({
      success: true,
      checkInStatus
    })

  } catch (error) {
    console.error('Exception in get meeting check-in status:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}


