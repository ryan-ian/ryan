import { type NextRequest, NextResponse } from "next/server"
import { expirePendingBookings } from "@/lib/room-availability"
import { supabase } from "@/lib/supabase"

// POST /api/bookings/expire-pending - Manually trigger expiration of pending bookings
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Check if user is admin or facility manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    if (!['admin', 'facility_manager'].includes(userData.role)) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      )
    }

    // Expire pending bookings
    const result = await expirePendingBookings()

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: result.expiredCount,
        expiredBookings: result.expiredBookings
      },
      message: result.expiredCount > 0 
        ? `Successfully expired ${result.expiredCount} pending booking(s)`
        : "No pending bookings to expire"
    })

  } catch (error: any) {
    console.error("❌ [API] Error expiring pending bookings:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to expire pending bookings" 
      },
      { status: 500 }
    )
  }
}

// GET /api/bookings/expire-pending - Check for expired bookings without modifying them
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    const now = new Date().toISOString()
    
    // Get pending bookings that have passed their start time
    const { data: expiredBookings, error } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        rooms:room_id (name, location),
        users:user_id (name, email)
      `)
      .eq('status', 'pending')
      .lt('start_time', now)
      .order('start_time', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        expiredCount: expiredBookings?.length || 0,
        expiredBookings: expiredBookings || []
      }
    })

  } catch (error: any) {
    console.error("❌ [API] Error checking expired bookings:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to check expired bookings" 
      },
      { status: 500 }
    )
  }
}
