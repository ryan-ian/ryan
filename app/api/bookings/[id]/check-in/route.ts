import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { user_id } = body

    console.log(`🚀 [API] POST /api/bookings/${id}/check-in - Starting check-in process`)
    console.log(`👤 [API] User ID: ${user_id || 'Anonymous'}`)

    // Call the database function to handle check-in
    const { data, error } = await supabase.rpc('handle_booking_check_in', {
      booking_id_param: id,
      user_id_param: user_id || null
    })

    if (error) {
      console.error(`❌ [API] Database error during check-in:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to process check-in" 
        },
        { status: 500 }
      )
    }

    console.log(`📋 [API] Check-in result:`, data)

    if (!data.success) {
      console.log(`⚠️ [API] Check-in failed: ${data.error}`)
      return NextResponse.json(
        { 
          success: false,
          error: data.error 
        },
        { status: 400 }
      )
    }

    console.log(`✅ [API] Successfully checked in booking ${id}`)

    return NextResponse.json({
      success: true,
      checked_in_at: data.checked_in_at,
      message: "Successfully checked in"
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error during check-in for booking ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to process check-in" 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🔍 [API] GET /api/bookings/${id}/check-in - Getting check-in status`)

    // Get booking with check-in details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, checked_in_at, check_in_required, auto_release_at, grace_period_minutes, start_time, status')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`❌ [API] Error fetching booking:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to fetch booking" 
        },
        { status: 500 }
      )
    }

    if (!booking) {
      return NextResponse.json(
        { 
          success: false,
          error: "Booking not found" 
        },
        { status: 404 }
      )
    }

    const now = new Date()
    const startTime = new Date(booking.start_time)
    const checkInAvailableAt = new Date(startTime.getTime() - 15 * 60 * 1000) // 15 minutes before
    const autoReleaseAt = booking.auto_release_at ? new Date(booking.auto_release_at) : null

    const checkInStatus = {
      isCheckedIn: !!booking.checked_in_at,
      checkInTime: booking.checked_in_at,
      gracePeriodEnd: booking.auto_release_at,
      autoReleaseScheduled: !!booking.auto_release_at && !booking.checked_in_at,
      checkInRequired: booking.check_in_required ?? true,
      gracePeriodMinutes: booking.grace_period_minutes ?? 15,
      canCheckIn: now >= checkInAvailableAt && 
                  !booking.checked_in_at && 
                  booking.status === 'confirmed' &&
                  (!autoReleaseAt || now <= autoReleaseAt),
      checkInAvailableAt: checkInAvailableAt.toISOString()
    }

    console.log(`📋 [API] Check-in status for booking ${id}:`, checkInStatus)

    return NextResponse.json({
      success: true,
      checkInStatus
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error getting check-in status for booking ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to get check-in status" 
      },
      { status: 500 }
    )
  }
}
