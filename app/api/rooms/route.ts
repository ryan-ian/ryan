import { type NextRequest, NextResponse } from "next/server"
import { rooms } from "@/lib/data"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      // Allow public access to rooms for browsing
      return NextResponse.json(rooms)
    }

    const user = verifyToken(token)
    if (!user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

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

    const user = verifyToken(token)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const roomData = await request.json()

    const newRoom = {
      id: (rooms.length + 1).toString(),
      ...roomData,
      status: "available" as const,
    }

    rooms.push(newRoom)

    return NextResponse.json(newRoom, { status: 201 })
  } catch (error) {
    console.error("Create room error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
