import { type NextRequest, NextResponse } from "next/server"
import { getRoomAvailability, updateRoomAvailability, createDefaultRoomAvailability } from "@/lib/room-availability"
import { supabase } from "@/lib/supabase"

// GET /api/rooms/[id]/availability - Get room availability settings
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Get room availability
    const availability = await getRoomAvailability(roomId)

    return NextResponse.json({
      success: true,
      data: availability
    })

  } catch (error: any) {
    console.error("❌ [API] Error fetching room availability:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room availability" 
      },
      { status: 500 }
    )
  }
}

// PUT /api/rooms/[id]/availability - Update room availability settings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Parse request body
    const updates = await request.json()

    // Validate required fields
    if (!updates.operating_hours) {
      return NextResponse.json(
        { success: false, error: "Operating hours are required" },
        { status: 400 }
      )
    }

    // Validate operating hours structure
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for (const day of requiredDays) {
      if (!updates.operating_hours[day] || 
          typeof updates.operating_hours[day].enabled !== 'boolean' ||
          !updates.operating_hours[day].start ||
          !updates.operating_hours[day].end) {
        return NextResponse.json(
          { success: false, error: `Invalid operating hours for ${day}` },
          { status: 400 }
        )
      }
    }

    // Validate numeric fields
    if (updates.min_booking_duration && (updates.min_booking_duration < 15 || updates.min_booking_duration > 480)) {
      return NextResponse.json(
        { success: false, error: "Minimum booking duration must be between 15 and 480 minutes" },
        { status: 400 }
      )
    }

    if (updates.max_booking_duration && (updates.max_booking_duration < 30 || updates.max_booking_duration > 1440)) {
      return NextResponse.json(
        { success: false, error: "Maximum booking duration must be between 30 and 1440 minutes" },
        { status: 400 }
      )
    }

    if (updates.buffer_time && (updates.buffer_time < 0 || updates.buffer_time > 60)) {
      return NextResponse.json(
        { success: false, error: "Buffer time must be between 0 and 60 minutes" },
        { status: 400 }
      )
    }

    if (updates.advance_booking_days && (updates.advance_booking_days < 1 || updates.advance_booking_days > 365)) {
      return NextResponse.json(
        { success: false, error: "Advance booking days must be between 1 and 365" },
        { status: 400 }
      )
    }

    // Update room availability
    const updatedAvailability = await updateRoomAvailability(roomId, updates)

    return NextResponse.json({
      success: true,
      data: updatedAvailability,
      message: "Room availability updated successfully"
    })

  } catch (error: any) {
    console.error("❌ [API] Error updating room availability:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update room availability" 
      },
      { status: 500 }
    )
  }
}

// POST /api/rooms/[id]/availability - Create default availability settings
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id

    if (!roomId) {
      return NextResponse.json(
        { success: false, error: "Room ID is required" },
        { status: 400 }
      )
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      )
    }

    // Create default availability settings
    const availability = await createDefaultRoomAvailability(roomId)

    return NextResponse.json({
      success: true,
      data: availability,
      message: "Default room availability created successfully"
    })

  } catch (error: any) {
    console.error("❌ [API] Error creating room availability:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to create room availability" 
      },
      { status: 500 }
    )
  }
}
