import { type NextRequest, NextResponse } from "next/server"
import { getRoomBlackouts, createRoomBlackout } from "@/lib/room-availability"
import { supabase } from "@/lib/supabase"

// GET /api/rooms/[id]/blackouts - Get room blackouts
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

    // Get room blackouts
    const blackouts = await getRoomBlackouts(roomId)

    return NextResponse.json({
      success: true,
      data: blackouts
    })

  } catch (error: any) {
    console.error("❌ [API] Error fetching room blackouts:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room blackouts" 
      },
      { status: 500 }
    )
  }
}

// POST /api/rooms/[id]/blackouts - Create room blackout
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

    // Parse request body
    const blackoutData = await request.json()

    // Validate required fields
    if (!blackoutData.title || !blackoutData.start_time || !blackoutData.end_time) {
      return NextResponse.json(
        { success: false, error: "Title, start time, and end time are required" },
        { status: 400 }
      )
    }

    // Validate dates
    const startTime = new Date(blackoutData.start_time)
    const endTime = new Date(blackoutData.end_time)

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date format" },
        { status: 400 }
      )
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { success: false, error: "End time must be after start time" },
        { status: 400 }
      )
    }

    // Validate blackout type
    const validTypes = ['maintenance', 'cleaning', 'event', 'holiday', 'repair', 'other']
    if (blackoutData.blackout_type && !validTypes.includes(blackoutData.blackout_type)) {
      return NextResponse.json(
        { success: false, error: "Invalid blackout type" },
        { status: 400 }
      )
    }

    // Create blackout
    const blackout = await createRoomBlackout({
      room_id: roomId,
      title: blackoutData.title,
      description: blackoutData.description,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      blackout_type: blackoutData.blackout_type || 'maintenance',
      is_recurring: blackoutData.is_recurring || false,
      recurrence_pattern: blackoutData.recurrence_pattern,
      is_active: true
    })

    return NextResponse.json({
      success: true,
      data: blackout,
      message: "Room blackout created successfully"
    })

  } catch (error: any) {
    console.error("❌ [API] Error creating room blackout:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to create room blackout" 
      },
      { status: 500 }
    )
  }
}
