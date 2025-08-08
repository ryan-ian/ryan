import { type NextRequest, NextResponse } from "next/server"
import { updateRoomBlackout, deleteRoomBlackout } from "@/lib/room-availability"
import { supabase } from "@/lib/supabase"

// PUT /api/blackouts/[id] - Update room blackout
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blackoutId = params.id

    if (!blackoutId) {
      return NextResponse.json(
        { success: false, error: "Blackout ID is required" },
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

    // Validate dates if provided
    if (updates.start_time && updates.end_time) {
      const startTime = new Date(updates.start_time)
      const endTime = new Date(updates.end_time)

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
    }

    // Validate blackout type if provided
    if (updates.blackout_type) {
      const validTypes = ['maintenance', 'cleaning', 'event', 'holiday', 'repair', 'other']
      if (!validTypes.includes(updates.blackout_type)) {
        return NextResponse.json(
          { success: false, error: "Invalid blackout type" },
          { status: 400 }
        )
      }
    }

    // Update blackout
    const updatedBlackout = await updateRoomBlackout(blackoutId, updates)

    return NextResponse.json({
      success: true,
      data: updatedBlackout,
      message: "Room blackout updated successfully"
    })

  } catch (error: any) {
    console.error("❌ [API] Error updating room blackout:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update room blackout" 
      },
      { status: 500 }
    )
  }
}

// DELETE /api/blackouts/[id] - Delete room blackout
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const blackoutId = params.id

    if (!blackoutId) {
      return NextResponse.json(
        { success: false, error: "Blackout ID is required" },
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

    // Delete blackout
    await deleteRoomBlackout(blackoutId)

    return NextResponse.json({
      success: true,
      message: "Room blackout deleted successfully"
    })

  } catch (error: any) {
    console.error("❌ [API] Error deleting room blackout:", error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to delete room blackout" 
      },
      { status: 500 }
    )
  }
}
