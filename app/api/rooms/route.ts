import { type NextRequest, NextResponse } from "next/server"
import { getRooms, createRoom, updateRoom, deleteRoom, getRoomById } from "@/lib/supabase-data"

export async function GET(request: NextRequest) {
  try {
    // Check if we're fetching a specific room by ID
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (id) {
      // Get a specific room
      const room = await getRoomById(id)
      
      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 })
      }
      
      return NextResponse.json(room)
    }
    
    // Get all rooms
    const rooms = await getRooms()
    return NextResponse.json(rooms)
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
      description: roomData.description || null
    })

    return NextResponse.json(newRoom, { status: 201 })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 })
    }

    // Note: Authentication check would go here
    // For simplicity, we're assuming the token is valid and the user is an admin

    const roomData = await request.json()
    
    console.log("Updating room data:", roomData)
    
    if (!roomData.id) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 })
    }

    // Update the room in Supabase
    const updatedRoom = await updateRoom(roomData.id, {
      name: roomData.name,
      location: roomData.location,
      capacity: roomData.capacity,
      room_resources: roomData.resources || roomData.room_resources, // Use resources field if available
      status: roomData.status,
      image: roomData.image,
      description: roomData.description
    })

    return NextResponse.json(updatedRoom)
  } catch (error) {
    console.error("Update room error:", error)
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
