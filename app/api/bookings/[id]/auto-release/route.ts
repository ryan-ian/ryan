import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🚀 [API] POST /api/bookings/${id}/auto-release - Starting auto-release process`)

    // Call the database function to handle auto-release
    const { data, error } = await supabase.rpc('handle_booking_auto_release', {
      booking_id_param: id
    })

    if (error) {
      console.error(`❌ [API] Database error during auto-release:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to process auto-release" 
        },
        { status: 500 }
      )
    }

    console.log(`📋 [API] Auto-release result:`, data)

    if (!data.success) {
      console.log(`⚠️ [API] Auto-release failed: ${data.error}`)
      return NextResponse.json(
        { 
          success: false,
          error: data.error 
        },
        { status: 400 }
      )
    }

    console.log(`✅ [API] Successfully auto-released booking ${id}`)

    return NextResponse.json({
      success: true,
      auto_released_at: data.auto_released_at,
      message: "Booking auto-released successfully"
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error during auto-release for booking ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to process auto-release" 
      },
      { status: 500 }
    )
  }
}
