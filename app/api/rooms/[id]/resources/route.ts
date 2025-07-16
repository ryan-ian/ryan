import { NextRequest, NextResponse } from "next/server"
import { assignResourceToRoom, getResourcesForRoom, removeAllResourcesFromRoom } from "@/lib/supabase-data"

// GET /api/rooms/[id]/resources
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    
    const resources = await getResourcesForRoom(roomId)
    
    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error getting room resources:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/rooms/[id]/resources
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    const { resourceId, quantity = 1 } = await request.json()
    
    if (!resourceId) {
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 })
    }
    
    await assignResourceToRoom(roomId, resourceId, quantity)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error assigning resource to room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/rooms/[id]/resources
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const roomId = params.id
    
    await removeAllResourcesFromRoom(roomId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing all resources from room:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 