import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    console.log(`🚀 [CRON] Starting auto-release job at ${new Date().toISOString()}`)

    // Get all bookings that should be auto-released
    const { data: bookingsToRelease, error: fetchError } = await supabase
      .from('bookings')
      .select('id, title, start_time, auto_release_at, room_id, user_id')
      .eq('status', 'confirmed')
      .is('checked_in_at', null)
      .not('auto_release_at', 'is', null)
      .lte('auto_release_at', new Date().toISOString())

    if (fetchError) {
      console.error(`❌ [CRON] Error fetching bookings for auto-release:`, fetchError)
      return NextResponse.json(
        { 
          success: false,
          error: fetchError.message 
        },
        { status: 500 }
      )
    }

    if (!bookingsToRelease || bookingsToRelease.length === 0) {
      console.log(`✅ [CRON] No bookings found for auto-release`)
      return NextResponse.json({
        success: true,
        message: "No bookings to auto-release",
        processed: 0
      })
    }

    console.log(`🔍 [CRON] Found ${bookingsToRelease.length} bookings to auto-release`)

    let successCount = 0
    let errorCount = 0
    const results = []

    // Process each booking
    for (const booking of bookingsToRelease) {
      try {
        console.log(`🔄 [CRON] Processing auto-release for booking ${booking.id}`)

        // Call the database function to handle auto-release
        const { data: releaseResult, error: releaseError } = await supabase.rpc('handle_booking_auto_release', {
          booking_id_param: booking.id
        })

        if (releaseError) {
          console.error(`❌ [CRON] Error auto-releasing booking ${booking.id}:`, releaseError)
          errorCount++
          results.push({
            booking_id: booking.id,
            success: false,
            error: releaseError.message
          })
          continue
        }

        if (!releaseResult.success) {
          console.log(`⚠️ [CRON] Auto-release failed for booking ${booking.id}: ${releaseResult.error}`)
          errorCount++
          results.push({
            booking_id: booking.id,
            success: false,
            error: releaseResult.error
          })
          continue
        }

        console.log(`✅ [CRON] Successfully auto-released booking ${booking.id}`)
        successCount++
        results.push({
          booking_id: booking.id,
          success: true,
          auto_released_at: releaseResult.auto_released_at
        })

        // TODO: Send notification to user about auto-release
        // This could be implemented to notify users that their booking was auto-released

      } catch (error) {
        console.error(`❌ [CRON] Exception processing booking ${booking.id}:`, error)
        errorCount++
        results.push({
          booking_id: booking.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    console.log(`🏁 [CRON] Auto-release job completed. Success: ${successCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Auto-release job completed`,
      processed: bookingsToRelease.length,
      successful: successCount,
      errors: errorCount,
      results
    })

  } catch (error: any) {
    console.error(`❌ [CRON] Error in auto-release job:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to run auto-release job" 
      },
      { status: 500 }
    )
  }
}

// Allow GET for testing purposes
export async function GET(request: NextRequest) {
  // Check for authorization header or API key in production
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // For now, just call the POST handler
  return POST(request)
}
