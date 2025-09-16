import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getRoomById } from "@/lib/supabase-data"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🔍 [API] GET /api/rooms/${id} - Fetching room details`)

    const room = await getRoomById(id)

    if (!room) {
      return NextResponse.json(
        { 
          success: false,
          error: "Room not found" 
        },
        { status: 404 }
      )
    }

    console.log(`📋 [API] Found room ${id}`)

    return NextResponse.json({
      success: true,
      room
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error fetching room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to fetch room" 
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    console.log(`🚀 [API] PATCH /api/rooms/${id} - Updating room`)
    console.log(`📝 [API] Update details:`, body)

    // Validate required fields
    if (!body.name || !body.location || !body.capacity) {
      return NextResponse.json(
        { 
          success: false,
          error: "Name, location, and capacity are required" 
        },
        { status: 400 }
      )
    }

    // If facility_id is provided but facility_name is not, look up the facility name
    let facilityName = body.facility_name

    if (body.facility_id && !facilityName) {
      const { data: facilityData } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', body.facility_id)
        .single()

      if (facilityData) {
        facilityName = facilityData.name
      }
    }

    // Prepare update data
    const updateData = {
      name: body.name,
      location: body.location,
      capacity: body.capacity,
      room_resources: body.room_resources || body.resources || [],
      status: body.status || 'available',
      image: body.image || null,
      description: body.description || null,
      facility_id: body.facility_id,
      facility_name: facilityName,
      // Pricing fields (only update if provided)
      ...(body.hourly_rate !== undefined && { hourly_rate: Number(body.hourly_rate) || 0 }),
      ...(body.currency !== undefined && { currency: body.currency || 'GHS' })
    }

    console.log('🔍 DEBUG - Supabase update data:', updateData)

    // Update the room
    const { data: room, error } = await supabase
      .from('rooms')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        facility:facility_id(id, name)
      `)
      .single()

    if (error) {
      console.error(`❌ [API] Error updating room:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to update room" 
        },
        { status: 500 }
      )
    }

    if (!room) {
      return NextResponse.json(
        { 
          success: false,
          error: "Room not found" 
        },
        { status: 404 }
      )
    }

    console.log(`✅ [API] Successfully updated room ${id}`)

    return NextResponse.json({
      success: true,
      room,
      message: "Room updated successfully"
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error updating room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to update room" 
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    console.log(`🗑️ [API] DELETE /api/rooms/${id} - Deleting room`)

    // Check if room has any active or future bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, start_time, status')
      .eq('room_id', id)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', new Date().toISOString())

    if (bookingsError) {
      console.error(`❌ [API] Error checking bookings:`, bookingsError)
      return NextResponse.json(
        { 
          success: false,
          error: "Failed to check room bookings" 
        },
        { status: 500 }
      )
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Cannot delete room with active or future bookings" 
        },
        { status: 409 }
      )
    }

    // Delete the room
    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(`❌ [API] Error deleting room:`, error)
      return NextResponse.json(
        { 
          success: false,
          error: error.message || "Failed to delete room" 
        },
        { status: 500 }
      )
    }

    console.log(`✅ [API] Successfully deleted room ${id}`)

    return NextResponse.json({
      success: true,
      message: "Room deleted successfully"
    })
  } catch (error: any) {
    const { id } = await params
    console.error(`❌ [API] Error deleting room ${id}:`, error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || "Failed to delete room" 
      },
      { status: 500 }
    )
  }
}
