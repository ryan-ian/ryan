import { type NextRequest, NextResponse } from "next/server"
import { getRooms, createRoom, deleteRoom, getRoomById } from "@/lib/supabase-data"
import { addCacheHeaders, addETag, cacheConfig } from "@/lib/api-cache"

export async function GET(request: NextRequest) {
  try {
    // Check for conditional request headers
    const ifNoneMatch = request.headers.get('if-none-match')
    
    // Check if we're fetching a specific room by ID
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      // Get a specific room
      const room = await getRoomById(id)
      
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 })
      }
      
      // Generate ETag for the room data
      const etag = `"${id}-${JSON.stringify(room).length}"`
      
      // If client has a matching ETag, return 304 Not Modified
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, { status: 304 })
      }
      
      // Return room data with cache headers
      let response = NextResponse.json(room)
      response = addCacheHeaders(response, cacheConfig.semiStatic)
      response.headers.set('ETag', etag)
      return response
    }
    
    // Get all rooms
    const rooms = await getRooms()
    
    // Generate ETag for the rooms collection
    const etag = `"rooms-${rooms.length}-${Date.now().toString().slice(0, -4)}"`
    
    // If client has a matching ETag, return 304 Not Modified
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new NextResponse(null, { status: 304 })
    }
    
    // Return rooms data with cache headers
    let response = NextResponse.json(rooms)
    response = addCacheHeaders(response, cacheConfig.semiStatic)
    response.headers.set('ETag', etag)
    return response
  } catch (error) {
    console.error("Get rooms error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    const roomData = await request.json()
    
    console.log("Received room data:", roomData)

    // Create the room in Supabase
    const newRoom = await createRoom({
      name: roomData.name,
      location: roomData.location,
      capacity: roomData.capacity,
      room_resources: roomData.resources || [], // Map resources to room_resources
      status: roomData.status || "available",
      image: roomData.image || null,
      description: roomData.description || null,
      // Include pricing fields
      hourly_rate: Number(roomData.hourly_rate) || 0,
      currency: roomData.currency || 'GHS'
    })

    return NextResponse.json(newRoom, { status: 201 })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}



export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    // Get room ID from URL
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Delete the room
    await deleteRoom(id)

    return NextResponse.json({ success: true, message: "Room deleted successfully" })
  } catch (error) {
    console.error("Delete room error:", error)
    
    if (error instanceof Error) {
      if (error.message.includes('Cannot delete room with active or future bookings')) {
        return NextResponse.json({ 
          error: error.message
        }, { status: 409 })
      }
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
