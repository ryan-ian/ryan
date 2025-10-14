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

    // Get user info from authorization header for audit trail
    const token = request.headers.get("authorization")?.replace("Bearer ", "")
    let userId = null
    
    if (token) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (!authError && user) {
          userId = user.id
        }
      } catch (error) {
        console.warn("Could not get user from token for audit trail:", error)
      }
    }

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

    // Always look up the facility name to ensure it's populated correctly
    let facilityName = body.facility_name

    if (body.facility_id) {
      const { data: facilityData, error: facilityError } = await supabase
        .from('facilities')
        .select('name')
        .eq('id', body.facility_id)
        .single()

      if (!facilityError && facilityData) {
        facilityName = facilityData.name
        console.log(`🔍 [API] Found facility name: ${facilityName} for facility_id: ${body.facility_id}`)
      } else {
        console.warn(`⚠️ [API] Could not find facility name for facility_id: ${body.facility_id}`, facilityError)
      }
    }

    // Prepare base update data without pricing fields
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
      // Audit fields
      ...(userId && { updated_by: userId })
    }

    console.log('🔍 DEBUG - Supabase update data:', updateData)

    // Handle pricing separately to avoid trigger conflicts
    let pricingUpdateSuccess = true
    if (body.hourly_rate !== undefined || body.currency !== undefined) {
      try {
        // Get current room pricing to compare
        const { data: currentRoom } = await supabase
          .from('rooms')
          .select('hourly_rate, currency')
          .eq('id', id)
          .single()

        const newPrice = body.hourly_rate !== undefined ? Number(body.hourly_rate) : (currentRoom?.hourly_rate || 0)
        const newCurrency = body.currency || currentRoom?.currency || 'GHS'

        // Debug logging for zero price scenarios
        if (body.hourly_rate !== undefined) {
          console.log(`💰 [API] Price update requested: ${body.hourly_rate} -> ${newPrice}`)
          if (newPrice === 0) {
            console.log(`🆓 [API] Setting room ${id} to FREE (₵0.00)`)
          }
        }

        // Create pricing history record first (if price is changing and we have userId)
        if (userId && currentRoom && currentRoom.hourly_rate !== newPrice) {
          await supabase
            .from('room_pricing_history')
            .insert({
              room_id: id,
              old_price: currentRoom.hourly_rate || 0,
              new_price: newPrice,
              currency: newCurrency,
              changed_by: userId,
              change_reason: 'Room price updated by facility manager'
            })
          
          console.log(`💰 [API] Created pricing history record for room ${id}`)
        }

        // Update pricing fields separately
        const pricingUpdate = {
          ...(body.hourly_rate !== undefined && { hourly_rate: newPrice }),
          ...(body.currency !== undefined && { currency: newCurrency })
        }

        if (Object.keys(pricingUpdate).length > 0) {
          const { error: pricingError } = await supabase
            .from('rooms')
            .update(pricingUpdate)
            .eq('id', id)

          if (pricingError) {
            console.error('❌ [API] Error updating pricing:', pricingError)
            pricingUpdateSuccess = false
          } else {
            console.log(`💰 [API] Updated pricing for room ${id}`)
          }
        }
      } catch (pricingError) {
        console.warn('⚠️ [API] Could not handle pricing update:', pricingError)
        pricingUpdateSuccess = false
      }
    }

    // Update the room (non-pricing fields)
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
      message: "Room updated successfully",
      ...(body.hourly_rate !== undefined && { 
        pricingUpdateSuccess,
        pricingMessage: pricingUpdateSuccess ? "Pricing updated successfully" : "Pricing update had issues - check logs"
      })
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
